import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Books,
  Brain,
  CalendarCheck,
  CaretDown,
  Check,
  CheckCircle,
  Database,
  FileArrowDown,
  FilePdf,
  Flask,
  FolderOpen,
  FunnelSimple,
  GearSix,
  GraduationCap,
  House,
  ListChecks,
  MagnifyingGlass,
  Moon,
  NotePencil,
  Shuffle,
  Sparkle,
  Sun,
  Table,
  UploadSimple,
  X,
} from '@phosphor-icons/react'
import { Badge, Button, Dialog, IconButton, TextArea, TextField, Theme } from '@radix-ui/themes'
import { LocalStudyDatabase } from './sqlite'
import { BRANCH_RELATION_GROUPS, HIDDEN_STEMS, NAYIN, RELATION_QUIZ_QUESTIONS, STEM_BASICS, STEM_RELATION_GROUPS, detectChartRelations, summarizeChartFoundations, tenGodFor, type RelationGroup } from './foundations'
import { buildCaseQuiz } from './quiz'
import { QUIZ_SKILLS, evaluateQuizCases, parseQuizAnswers, quizMistakeLabels, quizSkillFor } from './quiz-progress'
import { BOOK_GROUPS, REFERENCE_BOOKS, matchLocalBook, type BookGroup } from './library'
import { TOPIC_WORKFLOWS } from './workflows'
import { DAY_STEMS, EMPTY_FILTERS, parseSmartQuery, searchCases, type SmartFilters } from './search'
import { dueCaseRecords, nextReviewAt as calculateNextReviewAt, REVIEW_LEVELS } from './review'
import {
  getAllLocalRecords,
  getDatabaseAsset,
  importLocalRecords,
  removeDatabaseAsset,
  saveDatabaseAsset,
  saveLocalRecord,
} from './storage'
import type {
  CaseDetail,
  CaseSearchDocument,
  Chart,
  DatabaseAsset,
  LocalRecord,
  Route,
  RouteName,
  RuleEvidence,
  RuleFamily,
  RuleHoldout,
  RuleSummary,
  TrainingCard,
  TrainingModule,
} from './types'

const navItems: Array<{ name: RouteName; label: string; icon: typeof House }> = [
  { name: 'home', label: '今日', icon: House },
  { name: 'training', label: '学习', icon: GraduationCap },
  { name: 'cases', label: '案例', icon: BookOpenText },
  { name: 'library', label: '书架', icon: Books },
]

function parseRoute(): Route {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  const name = (parts[0] || 'home') as RouteName
  const valid: RouteName[] = ['home', 'training', 'quiz', 'library', 'rules', 'cases', 'case', 'rule', 'training-card', 'blind', 'practice']
  if (!valid.includes(name)) return { name: 'home' }
  return { name, id: parts[1], secondaryId: parts[2] }
}

function go(name: RouteName, id?: string, secondaryId?: string) {
  window.location.hash = `/${[name, id, secondaryId].filter(Boolean).join('/')}`
}

function goToSavedTraining() {
  const savedMode = localStorage.getItem('zhou-training-mode') || 'quiz'
  const validMode = ['quiz', 'foundations', 'workflows', 'advanced'].includes(savedMode) ? savedMode : 'quiz'
  const workflowId = localStorage.getItem('zhou-workflow-id') || TOPIC_WORKFLOWS[0].id
  go('training', validMode, validMode === 'workflows' ? workflowId : undefined)
}

function useRoute() {
  const [route, setRoute] = useState(parseRoute)
  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  return route
}

function jsonList(value: string): string[] {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function splitTags(value: string): string[] {
  return value ? value.split('|').filter(Boolean) : []
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function recordId(kind: LocalRecord['kind'], caseUid: string, ruleId?: string) {
  if (kind === 'blind') return `${kind}:${ruleId}:${caseUid}`
  if (kind === 'practice') return `${kind}:${caseUid}:${ruleId || 'latest'}`
  if (kind === 'quiz') return `${kind}:${caseUid}`
  return `${kind}:${caseUid}`
}

function canLoadProjectDatabase() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

async function fetchProjectDatabaseAsset(): Promise<DatabaseAsset | undefined> {
  if (!canLoadProjectDatabase()) return undefined
  const response = await fetch('/__local/zhou.sqlite', { cache: 'no-store' })
  if (!response.ok) return undefined
  const bytes = await response.arrayBuffer()
  return {
    key: 'database',
    name: 'zhou.sqlite（项目自动载入）',
    size: bytes.byteLength,
    importedAt: new Date().toISOString(),
    bytes,
  }
}

function App() {
  const route = useRoute()
  const databaseRef = useRef(new LocalStudyDatabase())
  const [db, setDb] = useState<LocalStudyDatabase | null>(null)
  const [asset, setAsset] = useState<DatabaseAsset>()
  const [records, setRecords] = useState<LocalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() =>
    (localStorage.getItem('zhou-theme') as 'light' | 'dark' | 'system') || 'system',
  )
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([getDatabaseAsset(), getAllLocalRecords()])
      .then(async ([storedAsset, storedRecords]) => {
        if (cancelled) return
        setRecords(storedRecords)
        if (storedAsset) {
          try {
            await activateDatabase(storedAsset, false)
            return
          } catch {
            await removeDatabaseAsset()
          }
        }
        const projectAsset = await fetchProjectDatabaseAsset()
        if (projectAsset) {
          await activateDatabase(projectAsset)
          return
        }
        if (canLoadProjectDatabase()) setError('未能自动读取项目数据库。请关闭旧的启动窗口，重新双击 start_web.cmd；也可以手动选择项目 db 文件夹中的 zhou.sqlite。')
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : '载入本地数据失败。'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  async function activateDatabase(nextAsset: DatabaseAsset, persist = true) {
    const nextDatabase = new LocalStudyDatabase()
    await nextDatabase.open(nextAsset.bytes)
    if (persist) await saveDatabaseAsset(nextAsset)
    databaseRef.current.close()
    databaseRef.current = nextDatabase
    setAsset(nextAsset)
    setDb(nextDatabase)
  }

  async function importDatabase(file: File) {
    setLoading(true)
    setError('')
    try {
      const bytes = await file.arrayBuffer()
      const nextAsset: DatabaseAsset = {
        key: 'database',
        name: file.name,
        size: file.size,
        importedAt: new Date().toISOString(),
        bytes,
      }
      await activateDatabase(nextAsset)
      go('home')
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : '数据库导入失败。'
      const message = `文件“${file.name}”（${formatBytes(file.size)}）无法载入：${detail}。请选择项目 db 文件夹中的 zhou.sqlite。`
      setError(message)
      if (db) window.alert(message)
    } finally {
      setLoading(false)
    }
  }

  async function loadProjectDatabase() {
    setLoading(true)
    setError('')
    try {
      const projectAsset = await fetchProjectDatabaseAsset()
      if (!projectAsset) throw new Error('本地服务没有提供项目数据库，请重新启动 start_web.cmd。')
      await activateDatabase(projectAsset)
      go('home')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '项目数据库载入失败。')
    } finally {
      setLoading(false)
    }
  }

  async function saveRecord(record: LocalRecord) {
    await saveLocalRecord(record)
    setRecords((current) => [...current.filter((item) => item.id !== record.id), record])
  }

  async function clearDatabase() {
    if (!window.confirm('只移除当前浏览器中的数据库副本，个人笔记仍会保留。继续吗？')) return
    await removeDatabaseAsset()
    databaseRef.current.close()
    setAsset(undefined)
    setDb(null)
  }

  const appearance = themeMode === 'system' ? (systemDark ? 'dark' : 'light') : themeMode
  function changeTheme(mode: 'light' | 'dark' | 'system') {
    localStorage.setItem('zhou-theme', mode)
    setThemeMode(mode)
  }

  return (
    <Theme appearance={appearance} accentColor="red" grayColor="slate" radius="medium" scaling="100%">
      {loading && !db ? <LoadingScreen /> : db && asset ? (
        <AppShell
          route={route}
          db={db}
          asset={asset}
          records={records}
          themeMode={themeMode}
          onTheme={changeTheme}
          onImport={importDatabase}
          onClear={clearDatabase}
          onSave={saveRecord}
          onImportRecords={async (items) => {
            await importLocalRecords(items)
            setRecords(await getAllLocalRecords())
          }}
        />
      ) : (
        <Onboarding loading={loading} error={error} onImport={importDatabase} onLoadProject={loadProjectDatabase} />
      )}
    </Theme>
  )
}

function LoadingScreen() {
  return <main className="center-screen"><div className="loading-mark" /><p>正在打开本地资料库</p></main>
}

function FilePicker({ onImport, children, className = '' }: { onImport: (file: File) => void; children: ReactNode; className?: string }) {
  return (
    <label className={`file-picker ${className}`}>
      <input
        type="file"
        accept=".sqlite,.sqlite3,.db,application/vnd.sqlite3"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onImport(file)
          event.currentTarget.value = ''
        }}
      />
      {children}
    </label>
  )
}

function Onboarding({ loading, error, onImport, onLoadProject }: { loading: boolean; error: string; onImport: (file: File) => void; onLoadProject: () => void }) {
  const localProject = canLoadProjectDatabase()
  return (
    <main className="onboarding">
      <section className="onboarding-copy">
        <div className="seal">周</div>
        <p className="eyebrow">本地优先的案例学习工具</p>
        <h1>把 128 例，读成自己的判断力。</h1>
        <p className="lead">案例、规则证据、训练卡与笔记在同一个界面里。数据库只进入当前浏览器，不经过服务器。</p>
        {localProject ? <div className="database-entry-actions"><button className="primary-file-button" onClick={onLoadProject} disabled={loading}><Database size={19} weight="duotone" />{loading ? '正在检查…' : '载入项目数据库'}</button><FilePicker onImport={onImport}><span className="secondary-file-button"><UploadSimple size={17} />手动选择其他 SQLite</span></FilePicker></div> : <FilePicker onImport={onImport}><span className="primary-file-button"><Database size={19} weight="duotone" />{loading ? '正在检查…' : '选择 zhou.sqlite'}</span></FilePicker>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <div className="onboarding-steps">
          <div><span>1</span><p><strong>{localProject ? '自动载入' : '选择数据库'}</strong><small>{localProject ? '本机读取项目 db/zhou.sqlite' : '选择项目中的 db/zhou.sqlite'}</small></p></div>
          <div><span>2</span><p><strong>开始学习</strong><small>训练、规则和案例均可离线阅读</small></p></div>
          <div><span>3</span><p><strong>定期备份</strong><small>从设置导出个人笔记 JSON</small></p></div>
        </div>
      </section>
      <aside className="privacy-note">
        <Database size={24} weight="duotone" />
        <h2>数据边界很清楚</h2>
        <p>网页只是阅读器。原始资料不随网页发布，GitHub Pages 上也没有你的数据库。</p>
      </aside>
    </main>
  )
}

type ShellProps = {
  route: Route
  db: LocalStudyDatabase
  asset: DatabaseAsset
  records: LocalRecord[]
  themeMode: 'light' | 'dark' | 'system'
  onTheme: (mode: 'light' | 'dark' | 'system') => void
  onImport: (file: File) => void
  onClear: () => void
  onSave: (record: LocalRecord) => Promise<void>
  onImportRecords: (records: LocalRecord[]) => Promise<void>
}

function AppShell(props: ShellProps) {
  const { route, db, records } = props
  const fromWorkflow = route.secondaryId?.startsWith('workflow-')
  const topicPractice = route.name === 'practice' && route.secondaryId?.startsWith('topic-')
  const activeName = (route.name === 'case' && fromWorkflow) || topicPractice ? 'training' : route.name === 'case' || route.name === 'practice' ? 'cases' : route.name === 'rule' || route.name === 'blind' ? 'training' : route.name === 'training-card' || route.name === 'quiz' ? 'training' : route.name
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => go('home')}><span>周</span><span><strong>周氏案研</strong><small>CASE STUDY</small></span></button>
        <nav aria-label="主导航">
          {navItems.map((item) => <NavButton key={item.name} item={item} active={activeName === item.name} />)}
        </nav>
        <div className="sidebar-foot"><span className="local-dot" />数据留在本机</div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div><p className="eyebrow">周氏十年断命学习库</p><strong>{pageTitle(route)}</strong></div>
          <SettingsDialog {...props} />
        </header>
        <div className="page-frame">
          {route.name === 'home' && <HomeView db={db} records={records} />}
          {route.name === 'training' && <TrainingView db={db} records={records} route={route} />}
          {route.name === 'quiz' && route.id && <QuizView key={`${route.id}-${route.secondaryId || 'full'}`} db={db} caseUid={route.id} records={records} reviewWrong={route.secondaryId === 'wrong'} onSave={props.onSave} />}
          {route.name === 'training-card' && route.id && <TrainingCardView db={db} caseUid={route.id} records={records} onSave={props.onSave} />}
          {route.name === 'rules' && <RulesView db={db} />}
          {route.name === 'rule' && route.id && <RuleView db={db} ruleId={route.id} records={records} />}
          {route.name === 'blind' && route.id && route.secondaryId && <BlindView db={db} ruleId={route.id} caseUid={route.secondaryId} records={records} onSave={props.onSave} />}
          {route.name === 'cases' && <CasesView db={db} records={records} initialWorkflowId={route.id === 'workflow' ? route.secondaryId : undefined} />}
          {route.name === 'case' && route.id && <CaseView db={db} caseUid={route.id} records={records} onSave={props.onSave} source={route.secondaryId} />}
          {route.name === 'practice' && route.id && <PracticeView key={`${route.id}-${route.secondaryId || 'latest'}`} db={db} caseUid={route.id} attemptId={route.secondaryId || 'latest'} records={records} onSave={props.onSave} />}
          {route.name === 'library' && <LibraryView />}
        </div>
      </main>
      <nav className="bottom-nav" aria-label="移动端主导航">
        {navItems.map((item) => <NavButton key={item.name} item={item} active={activeName === item.name} compact />)}
      </nav>
    </div>
  )
}

function NavButton({ item, active, compact = false }: { item: typeof navItems[number]; active: boolean; compact?: boolean }) {
  const Icon = item.icon
  return <button className={`nav-button ${active ? 'active' : ''} ${compact ? 'compact' : ''}`} onClick={() => item.name === 'training' ? goToSavedTraining() : go(item.name)}><Icon size={compact ? 21 : 20} weight={active ? 'fill' : 'regular'} /><span>{item.label}</span></button>
}

function pageTitle(route: Route) {
  if (route.name === 'home') return '今日学习'
  if (route.name === 'training' || route.name === 'training-card' || route.name === 'quiz' || route.name === 'practice' && route.secondaryId?.startsWith('topic-')) return '个人学习'
  if (route.name === 'library') return '参考书架'
  if (route.name === 'rules' || route.name === 'rule' || route.name === 'blind') return '规则与证据'
  return route.name === 'cases' || route.name === 'practice' ? '智能检索' : '案例文库'
}

function SettingsDialog(props: ShellProps) {
  const [message, setMessage] = useState('')
  async function exportNotes() {
    const payload = JSON.stringify({ format: 'zhou-study-notes', exportedAt: new Date().toISOString(), records: props.records }, null, 2)
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `周氏案研笔记-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  async function importNotes(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as { format?: string; records?: LocalRecord[] }
      if (parsed.format !== 'zhou-study-notes' || !Array.isArray(parsed.records)) throw new Error('不是有效的周氏案研笔记备份。')
      await props.onImportRecords(parsed.records)
      setMessage(`已导入 ${parsed.records.length} 条本地记录。`)
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '导入失败。')
    } finally {
      event.target.value = ''
    }
  }
  return (
    <Dialog.Root>
      <Dialog.Trigger><IconButton variant="ghost" size="3" aria-label="打开设置" title="设置"><GearSix size={21} /></IconButton></Dialog.Trigger>
      <Dialog.Content maxWidth="540px">
        <Dialog.Title>本地数据与外观</Dialog.Title>
        <Dialog.Description>管理当前设备中的数据库副本和个人笔记。</Dialog.Description>
        <div className="settings-section">
          <h3>资料库</h3>
          <div className="database-row"><Database size={22} /><div><strong>{props.asset.name}</strong><small>{formatBytes(props.asset.size)} · 导入于 {new Date(props.asset.importedAt).toLocaleDateString('zh-CN')}</small></div></div>
          <div className="button-row">
            <FilePicker onImport={props.onImport}><span className="secondary-file-button"><UploadSimple size={17} />替换数据库</span></FilePicker>
            <Button variant="soft" color="gray" onClick={props.onClear}>移除本机副本</Button>
          </div>
        </div>
        <div className="settings-section">
          <h3>个人笔记</h3>
          <p>当前共 {props.records.length} 条。导出的 JSON 可用于迁移到手机或另一台电脑。</p>
          <div className="button-row">
            <Button variant="soft" onClick={exportNotes}><FileArrowDown size={17} />导出备份</Button>
            <label className="secondary-file-button"><input type="file" accept="application/json,.json" onChange={importNotes} /><UploadSimple size={17} />导入备份</label>
          </div>
          {message && <p className="inline-message">{message}</p>}
        </div>
        <div className="settings-section">
          <h3>外观</h3>
          <div className="segmented">
            <button className={props.themeMode === 'light' ? 'active' : ''} onClick={() => props.onTheme('light')}><Sun size={16} />浅色</button>
            <button className={props.themeMode === 'dark' ? 'active' : ''} onClick={() => props.onTheme('dark')}><Moon size={16} />深色</button>
            <button className={props.themeMode === 'system' ? 'active' : ''} onClick={() => props.onTheme('system')}>跟随系统</button>
          </div>
        </div>
        <Dialog.Close><Button variant="soft" color="gray" className="dialog-close">完成</Button></Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}

type QuizCaseItem = {
  case_uid: string
  printed_label: string
  title: string
  section_index: number
  methods: string
}

function availableQuizCases(db: LocalStudyDatabase) {
  return db.query<QuizCaseItem>(`SELECT c.case_uid, c.printed_label, c.title, c.section_index, c.methods
    FROM cases c
    WHERE EXISTS (SELECT 1 FROM charts ch WHERE ch.case_uid=c.case_uid AND length(ch.day_pillar)=2)
    ORDER BY c.section_index`)
}

type TopicPracticeCase = {
  case_uid: string
  printed_label: string
  title: string
}

function availableTopicCases(db: LocalStudyDatabase, topic: string) {
  return db.query<TopicPracticeCase>(`SELECT c.case_uid, c.printed_label, c.title
    FROM cases c JOIN tags t ON t.case_uid=c.case_uid
    WHERE t.kind='topic' AND t.tag=?
      AND EXISTS (SELECT 1 FROM charts ch WHERE ch.case_uid=c.case_uid AND ch.chart_type='natal_bazi' AND length(ch.day_pillar)=2)
    ORDER BY c.section_index`, [topic])
}

function HomeView({ db, records }: { db: LocalStudyDatabase; records: LocalRecord[] }) {
  const meta = db.metadata()
  const quizCases = availableQuizCases(db)
  const starterIds = db.query<{ case_uid: string }>('SELECT case_uid FROM training_cards ORDER BY sequence').map((item) => item.case_uid).filter((id) => quizCases.some((item) => item.case_uid === id))
  const orderedCases = [...starterIds.map((id) => quizCases.find((item) => item.case_uid === id)).filter(Boolean) as QuizCaseItem[], ...quizCases.filter((item) => !starterIds.includes(item.case_uid))]
  const evaluations = evaluateQuizCases(db, quizCases, records)
  const completedQuizzes = quizCases.filter((item) => evaluations.get(item.case_uid)?.complete).length
  const nextIncomplete = orderedCases.find((item) => !evaluations.get(item.case_uid)?.complete)
  const reviewEvaluation = [...evaluations.entries()]
    .filter(([, evaluation]) => evaluation.complete && evaluation.wrong.length)
    .sort(([, first], [, second]) => second.wrong.length - first.wrong.length)[0]
  const nextCase = nextIncomplete || quizCases.find((item) => item.case_uid === reviewEvaluation?.[0])
  const reviewing = !nextIncomplete && Boolean(nextCase)
  const dueRecords = dueCaseRecords(records)
  const dueCase = dueRecords[0] ? db.query<{ case_uid: string; printed_label: string; title: string }>('SELECT case_uid, printed_label, title FROM cases WHERE case_uid=?', [dueRecords[0].caseUid])[0] : undefined
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div><p className="eyebrow">{dueCase ? '今天先复习' : '今天学一点就够'}</p><h1>{dueCase ? '有一例到了复盘时间。' : nextCase ? reviewing ? '回看一组没有全对的题。' : '先做一组案例选择题。' : '全部可练案例已经完成。'}</h1><p>{dueCase ? `${dueCase.printed_label} · ${dueCase.title}；${dueRecords.length > 1 ? `另有 ${dueRecords.length - 1} 例等待复习。` : '今天只需复盘这一例。'}` : nextCase ? `${nextCase.printed_label} · ${nextCase.title}` : '可以检索案例原文，或进入规则证据区复盘。'}</p></div>
        <div className="button-row">{dueCase ? <Button size="3" onClick={() => go('case', dueCase.case_uid)}><CalendarCheck size={19} />开始到期复习</Button> : <Button size="3" onClick={() => nextCase ? go('quiz', nextCase.case_uid) : go('training')}><Brain size={19} />{nextCase ? reviewing ? '复习这一组' : '继续选择题' : '查看学习记录'}</Button>}{dueCase && nextCase && <Button className="hero-secondary" size="3" variant="soft" color="gray" onClick={() => go('quiz', nextCase.case_uid)}>继续选择题</Button>}</div>
      </section>
      <section className="stat-strip" aria-label="资料库概览">
        <Stat value={meta.case_sections || '131'} label="现有案例" />
        <Stat value={String(quizCases.length)} label={`可练案例 · 已完成 ${completedQuizzes}`} />
        <Stat value="12" label="地支藏干" />
        <Stat value="9" label="干支关系组" />
      </section>
      <section className="section-block learning-path">
        <div><h2>推荐学习顺序</h2><p>先认天干、十神、藏干、纳音与干支关系，再从十四例入门题进入专题步骤和盲练。</p></div>
        <ol><li><span>基础</span><strong>干支、十神与关系表</strong></li><li><span>入门</span><strong>十四例选择题</strong></li><li><span>步骤</span><strong>专题步骤与盲练</strong></li><li><span>对照</span><strong>全部案例与原文</strong></li></ol>
        <div className="button-row"><Button onClick={() => go('training')}>进入学习</Button><Button variant="soft" color="gray" onClick={() => go('library')}>打开参考书架</Button></div>
      </section>
      <section className="advanced-entry">
        <div><strong>进阶研究区</strong><span>规则证据和预留盲测仍然保留，但不作为日常学习起点。</span></div><Button size="1" variant="ghost" color="gray" onClick={() => go('rules')}>查看规则证据<ArrowRight size={15} /></Button>
      </section>
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><strong>{value}</strong><span>{label}</span></div>
}

function TrainingView({ db, records, route }: { db: LocalStudyDatabase; records: LocalRecord[]; route: Route }) {
  type TrainingMode = 'quiz' | 'foundations' | 'workflows' | 'advanced'
  const savedMode = localStorage.getItem('zhou-training-mode') as TrainingMode | null
  const mode: TrainingMode = (['quiz', 'foundations', 'workflows', 'advanced'] as TrainingMode[]).includes(route.id as TrainingMode) ? route.id as TrainingMode : savedMode || 'quiz'
  const savedWorkflowId = localStorage.getItem('zhou-workflow-id') || TOPIC_WORKFLOWS[0].id
  const workflowId = TOPIC_WORKFLOWS.some((item) => item.id === route.secondaryId) ? route.secondaryId! : savedWorkflowId
  useEffect(() => {
    localStorage.setItem('zhou-training-mode', mode)
    if (mode === 'workflows') localStorage.setItem('zhou-workflow-id', workflowId)
  }, [mode, workflowId])
  function selectMode(next: TrainingMode) {
    localStorage.setItem('zhou-training-mode', next)
    go('training', next, next === 'workflows' ? workflowId : undefined)
  }
  return <div className="page-stack learning-page">
    <PageIntro eyebrow="个人学习" title="从会认盘开始，不急着断命。" body="先完成十四例入门题，再按专题学习步骤、盲练和复盘。例117缺少完整命盘，只保留在深度训练中。" />
    <nav className="learning-mode-tabs" aria-label="学习模式"><button className={mode === 'quiz' ? 'active' : ''} onClick={() => selectMode('quiz')}><CheckCircle size={18} />案例选择题</button><button className={mode === 'foundations' ? 'active' : ''} onClick={() => selectMode('foundations')}><Table size={18} />基础表</button><button className={mode === 'workflows' ? 'active' : ''} onClick={() => selectMode('workflows')}><ListChecks size={18} />专题步骤</button><button className={mode === 'advanced' ? 'active' : ''} onClick={() => selectMode('advanced')}><Brain size={18} />深度训练</button></nav>
    {mode === 'quiz' && <QuizCatalog db={db} records={records} />}
    {mode === 'foundations' && <FoundationReference db={db} focus={route.secondaryId} />}
    {mode === 'workflows' && <WorkflowReference db={db} records={records} selectedId={workflowId} onSelect={(id) => { localStorage.setItem('zhou-workflow-id', id); go('training', 'workflows', id) }} />}
    {mode === 'advanced' && <AdvancedTrainingList db={db} records={records} />}
  </div>
}

function QuizCatalog({ db, records }: { db: LocalStudyDatabase; records: LocalRecord[] }) {
  const [scope, setScope] = useState<'starter' | 'all' | 'review'>('starter')
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(30)
  const cases = availableQuizCases(db)
  const starterIds = db.query<{ case_uid: string }>('SELECT case_uid FROM training_cards ORDER BY sequence').map((item) => item.case_uid).filter((id) => cases.some((item) => item.case_uid === id))
  const methodCaseCount = cases.filter((item) => splitTags(item.methods).length).length
  const starterOrder = new Map(starterIds.map((id, index) => [id, index]))
  const evaluations = evaluateQuizCases(db, cases, records)
  const completed = cases.filter((item) => evaluations.get(item.case_uid)?.complete).length
  const mastered = cases.filter((item) => {
    const evaluation = evaluations.get(item.case_uid)
    return evaluation?.complete && evaluation.score === evaluation.total
  }).length
  const reviewCount = cases.filter((item) => {
    const evaluation = evaluations.get(item.case_uid)
    return evaluation?.complete && evaluation.wrong.length > 0
  }).length
  const skillStats = QUIZ_SKILLS.map((skill) => ({ ...skill, attempts: 0, mistakes: 0 }))
  const skillIndex = new Map<string, (typeof skillStats)[number]>(skillStats.map((skill) => [skill.questionId, skill]))
  for (const evaluation of evaluations.values()) {
    if (!evaluation.complete) continue
    for (const question of evaluation.questions) {
      const stat = skillIndex.get(question.id)
      if (!stat) continue
      stat.attempts += 1
      if (evaluation.answers[question.id] !== question.answer) stat.mistakes += 1
    }
  }
  let scopedCases = scope === 'starter' ? cases.filter((item) => starterOrder.has(item.case_uid)).sort((a, b) => (starterOrder.get(a.case_uid) || 0) - (starterOrder.get(b.case_uid) || 0)) : scope === 'review' ? cases.filter((item) => {
    const evaluation = evaluations.get(item.case_uid)
    return evaluation?.complete && evaluation.wrong.length > 0
  }).sort((a, b) => (evaluations.get(b.case_uid)?.wrong.length || 0) - (evaluations.get(a.case_uid)?.wrong.length || 0)) : cases
  const normalizedQuery = query.trim().toLowerCase()
  if (normalizedQuery) scopedCases = scopedCases.filter((item) => `${item.printed_label} ${item.title} ${item.methods}`.toLowerCase().includes(normalizedQuery))
  const visibleCases = scopedCases.slice(0, visibleCount)
  useEffect(() => setVisibleCount(30), [scope, query])

  return <section className="module-section quiz-catalog"><div className="module-heading"><div><GraduationCap size={24} /><div><h2>案例选择题库</h2><p>每例 4–5 题；命盘存在无歧义的干支关系时增加 1 题。{methodCaseCount} 例含方法标签，其余案例改问命盘月柱。</p></div></div><Badge color={completed === cases.length ? 'green' : 'gray'}>{completed}/{cases.length}</Badge></div>
    <div className="quiz-progress-strip"><div><strong>{starterIds.length}</strong><span>入门案例</span></div><div><strong>{completed}</strong><span>已完成</span></div><div><strong>{mastered}</strong><span>全部答对</span></div><div><strong>{reviewCount}</strong><span>需要复习</span></div></div>
    {completed > 0 && <section className="quiz-diagnostics"><header><div><small>个人错项诊断</small><strong>错在哪里，比总分更重要</strong></div><p>按当前版本题目重新统计；点击基础项目可直接回到对应速查表。</p></header><div className="quiz-diagnostic-grid">{skillStats.filter((stat) => stat.attempts > 0).map((stat) => {
      const content = <><span>{stat.label}</span><strong>{stat.mistakes}</strong><small>错误／{stat.attempts} 次</small></>
      return 'foundationFocus' in stat ? <button className={stat.mistakes ? 'has-mistakes' : 'clear'} key={stat.questionId} onClick={() => go('training', 'foundations', stat.foundationFocus)}>{content}</button> : <div className={stat.mistakes ? 'has-mistakes' : 'clear'} key={stat.questionId}>{content}</div>
    })}</div></section>}
    <div className="quiz-catalog-controls"><div className="quiz-scope-tabs"><button className={scope === 'starter' ? 'active' : ''} onClick={() => setScope('starter')}>入门 {starterIds.length} 例</button><button className={scope === 'all' ? 'active' : ''} onClick={() => setScope('all')}>全部 {cases.length} 例</button><button className={scope === 'review' ? 'active' : ''} onClick={() => setScope('review')}>待复习 {reviewCount}</button></div><label className="quiz-search"><MagnifyingGlass size={16} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索例号、标题或方法" /></label></div>
    {visibleCases.length ? <><div className="list-panel">{visibleCases.map((item, index) => {
      const evaluation = evaluations.get(item.case_uid)
      const displayIndex = scope === 'starter' ? (starterOrder.get(item.case_uid) || 0) + 1 : cases.indexOf(item) + 1
      const mistakeLabels = quizMistakeLabels(evaluation)
      const detail = evaluation?.complete ? mistakeLabels.length ? `得分 ${evaluation.score}/${evaluation.total} · 错项：${mistakeLabels.join('、')}` : `得分 ${evaluation.score}/${evaluation.total} · 全部答对` : evaluation?.answered ? `待完成 ${evaluation.answered}/${evaluation.total}，继续上次进度` : '4–5 道基础选择题'
      const badge = evaluation?.complete ? '可重做' : evaluation?.answered ? `待补 ${evaluation.total - evaluation.answered} 题` : '未完成'
      return <button className="list-row" key={item.case_uid} onClick={() => go('quiz', item.case_uid, scope === 'review' ? 'wrong' : undefined)}><span className={`row-index ${evaluation?.complete ? 'complete' : ''}`}>{evaluation?.complete ? <CheckCircle weight="fill" /> : String(displayIndex || index + 1).padStart(2, '0')}</span><span className="row-main"><strong>{item.printed_label} · {item.title}</strong><small>{detail}</small></span><Badge variant="soft" color={evaluation?.complete && !mistakeLabels.length ? 'green' : 'gray'}>{scope === 'review' ? '重做错题' : badge}</Badge><span className="row-arrow">›</span></button>
    })}</div>{visibleCount < scopedCases.length && <div className="load-more"><Button variant="soft" color="gray" onClick={() => setVisibleCount((count) => count + 30)}>再显示 {Math.min(30, scopedCases.length - visibleCount)} 例</Button></div>}</> : <div className="quiz-empty"><CheckCircle size={27} /><h3>{scope === 'review' ? '目前没有待复习题组' : '没有匹配的案例'}</h3><p>{scope === 'review' ? '答错的题组会自动出现在这里。' : '换一个关键词试试。'}</p></div>}
  </section>
}

function RelationScope({ label, title, groups }: { label: string; title: string; groups: RelationGroup[] }) {
  return <section className="relation-scope"><header><small>{label}</small><h3>{title}</h3></header><div className="relation-group-list">{groups.map((group) => <article className="relation-card" key={group.id}><div><h4>{group.title}</h4><p>{group.description}</p></div><div className="relation-pairs">{group.entries.map((entry) => <span key={`${group.id}-${entry.members}`}><b>{entry.members}</b>{entry.result && <small>{entry.result}</small>}</span>)}</div><footer>{group.boundary}</footer></article>)}</div></section>
}

function FoundationRelationQuiz() {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState('')
  const [score, setScore] = useState(0)
  const complete = questionIndex >= RELATION_QUIZ_QUESTIONS.length
  const question = RELATION_QUIZ_QUESTIONS[questionIndex]

  function choose(option: string) {
    if (selected || !question) return
    setSelected(option)
    if (option === question.answer) setScore((current) => current + 1)
  }

  function next() {
    setSelected('')
    setQuestionIndex((current) => current + 1)
  }

  function restart() {
    setQuestionIndex(0)
    setSelected('')
    setScore(0)
  }

  if (complete) return <section className="foundation-section relation-quiz-section"><div><h2>关系选择题</h2><p>只练配对识别和判断边界，不用背事件断语。</p></div><div className="relation-quiz-complete"><CheckCircle size={34} weight="fill" /><small>本轮完成</small><strong>{score} / {RELATION_QUIZ_QUESTIONS.length}</strong><p>{score === RELATION_QUIZ_QUESTIONS.length ? '基础配对已经全部答对，可以回到案例里找实际组合。' : '错题不需要硬背，回到上方关系卡核对后再做一轮。'}</p><Button onClick={restart}>重新练习</Button></div></section>

  return <section className="foundation-section relation-quiz-section"><div className="relation-quiz-heading"><div><h2>关系选择题</h2><p>一次一题，答完马上解释；共 {RELATION_QUIZ_QUESTIONS.length} 题。</p></div><span>{String(questionIndex + 1).padStart(2, '0')} / {RELATION_QUIZ_QUESTIONS.length}</span></div><div className="relation-quiz"><header><Badge variant="soft" color="gray">{question.category}</Badge><h3>{question.prompt}</h3></header><div className="relation-options">{question.options.map((option) => {
    const correct = Boolean(selected) && option === question.answer
    const wrong = selected === option && option !== question.answer
    return <button className={correct ? 'correct' : wrong ? 'wrong' : ''} disabled={Boolean(selected)} key={option} onClick={() => choose(option)}><span>{option}</span>{correct ? <Check size={18} weight="bold" /> : wrong ? <X size={18} weight="bold" /> : null}</button>
  })}</div>{selected && <div className={`relation-explanation ${selected === question.answer ? 'correct' : 'wrong'}`}><strong>{selected === question.answer ? '答对了' : `正确答案：${question.answer}`}</strong><p>{question.explanation}</p><Button size="1" onClick={next}>{questionIndex + 1 === RELATION_QUIZ_QUESTIONS.length ? '查看结果' : '下一题'}<ArrowRight size={14} /></Button></div>}</div></section>
}

function FoundationReference({ db, focus }: { db: LocalStudyDatabase; focus?: string }) {
  const [dayStem, setDayStem] = useState('甲')
  const charts = db.query<Chart>('SELECT * FROM charts ORDER BY case_uid, chart_index')
  const pillars = charts.flatMap((chart) => [chart.year_pillar, chart.month_pillar, chart.day_pillar, chart.hour_pillar])
  const branchCount = (branch: string) => pillars.filter((pillar) => pillar.endsWith(branch)).length
  const nayinCount = (first: string, second: string) => pillars.filter((pillar) => pillar === first || pillar === second).length
  const elements = ['金', '木', '水', '火', '土']
  useEffect(() => {
    if (!focus || !['stems', 'relations', 'hidden', 'nayin'].includes(focus)) return
    const frame = window.requestAnimationFrame(() => document.getElementById(`foundation-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    return () => window.cancelAnimationFrame(frame)
  }, [focus])
  return <div className="foundation-stack"><section className="foundation-section stem-foundation" id="foundation-stems"><div><h2>十天干与十神速查</h2><p>先认阴阳五行，再选择日主查看其余天干对应的十神。十神关系随日主改变。</p></div><div className="stem-basic-grid">{STEM_BASICS.map((item) => <article key={item.stem}><strong>{item.stem}</strong><span>{item.polarity}{item.element}</span></article>)}</div><div className="ten-god-reference"><header><div><small>当前日主</small><h3>{dayStem}日主</h3></div><div>{STEM_BASICS.map((item) => <button className={dayStem === item.stem ? 'active' : ''} key={item.stem} onClick={() => setDayStem(item.stem)}>{item.stem}</button>)}</div></header><div className="ten-god-grid">{STEM_BASICS.map((item) => <article key={item.stem}><span><strong>{item.stem}</strong><small>{item.polarity}{item.element}</small></span><b>{tenGodFor(dayStem, item.stem)}</b></article>)}</div></div></section>
    <section className="foundation-section relation-foundation" id="foundation-relations"><div><h2>天干、地支关系速查</h2><p>先识别组合，再回到命局判断作用。天干以五合、生克为基础；刑、害（穿）、破等属于地支关系。</p></div><div className="relation-scope-grid"><RelationScope label="十天干" title="五合与相克" groups={STEM_RELATION_GROUPS} /><RelationScope label="十二地支" title="合、会、冲、刑、害、破" groups={BRANCH_RELATION_GROUPS} /></div><aside className="relation-boundary"><strong>学习边界</strong><p>关系名称只回答“盘里出现了什么结构”，不直接回答吉凶。合不必然吉，冲刑害破也不必然凶；还要看月令、位置、旺衰、透藏与案例反馈。</p></aside></section>
    <FoundationRelationQuiz />
    <section className="foundation-section" id="foundation-hidden"><div><h2>十二地支藏干</h2><p>顺序按常用藏干表记录。右侧数字表示该地支在现有命盘四柱中出现的次数。</p></div><div className="hidden-stem-grid">{HIDDEN_STEMS.map((item) => <article key={item.branch}><header><strong>{item.branch}</strong><small>出现 {branchCount(item.branch)} 次</small></header><div>{item.stems.map((stem, index) => <span key={stem}><small>{index === 0 ? '本气' : index === 1 ? '中气' : '余气'}</small><strong>{stem}</strong></span>)}</div></article>)}</div></section>
    <section className="foundation-section" id="foundation-nayin"><div><h2>六十甲子纳音</h2><p>两个干支共用一个纳音名称。先认日柱，不把纳音直接扩展成案例结论。</p></div><div className="nayin-groups">{elements.map((element) => <section key={element}><h3>{element}</h3><div>{NAYIN.filter((item) => item.name.endsWith(element)).map((item) => <article key={item.name}><span>{item.pillars.join('、')}</span><strong>{item.name}</strong><small>库内 {nayinCount(...item.pillars)} 次</small></article>)}</div></section>)}</div></section></div>
}

function WorkflowReference({ db, records, selectedId, onSelect }: { db: LocalStudyDatabase; records: LocalRecord[]; selectedId: string; onSelect: (id: string) => void }) {
  const workflow = TOPIC_WORKFLOWS.find((item) => item.id === selectedId) || TOPIC_WORKFLOWS[0]
  const cases = db.query<{ case_uid: string; printed_label: string; title: string }>('SELECT case_uid, printed_label, title FROM cases ORDER BY section_index')
  const caseIndex = new Map(cases.map((item) => [item.case_uid, item]))
  const topicCounts = new Map(db.query<{ tag: string; count: number }>("SELECT tag, COUNT(*) count FROM tags WHERE kind='topic' GROUP BY tag").map((item) => [item.tag, item.count]))
  const practiceCases = availableTopicCases(db, workflow.topic)
  const practiceRecords = records.filter((record) => record.kind === 'practice' && record.completed && record.id.includes(`:topic-${workflow.id}-`))
  const practicedCaseIds = new Set(practiceRecords.map((record) => record.caseUid))

  function beginTopicPractice() {
    const unseen = practiceCases.filter((item) => !practicedCaseIds.has(item.case_uid))
    const pool = unseen.length ? unseen : practiceCases
    const target = pool[Math.floor(Math.random() * pool.length)]
    if (target) go('practice', target.case_uid, `topic-${workflow.id}-${Date.now().toString(36)}`)
  }

  return <div className="workflow-reference">
    <section className="workflow-index">
      <header><div><h2>从问题进入命盘</h2><p>八个专题均从现有 131 个案例整理；数字是库内带该主题标签的案例数。</p></div><Badge variant="soft" color="gray">案例内归纳</Badge></header>
      <div>{TOPIC_WORKFLOWS.map((item, index) => <button className={item.id === workflow.id ? 'active' : ''} key={item.id} onClick={() => onSelect(item.id)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><small>{topicCounts.get(item.topic) || 0} 例</small></button>)}</div>
    </section>

    <section className="workflow-detail">
      <header className="workflow-hero"><div><p>{workflow.topic} · {topicCounts.get(workflow.topic) || 0} 个相关案例</p><h2>{workflow.title}</h2><span>{workflow.description}</span><div className="workflow-actions"><Button size="1" disabled={!practiceCases.length} onClick={beginTopicPractice}><Shuffle size={14} />抽取专题盲练</Button><Button size="1" variant="soft" color="gray" onClick={() => go('cases', 'workflow', workflow.id)}>查看全部相关案例<ArrowRight size={14} /></Button></div><small className="workflow-practice-progress">可练 {practiceCases.length} 例 · 已练 {practicedCaseIds.size} 例／{practiceRecords.length} 次，优先抽取未练案例</small></div><div className="workflow-first-question"><small>第一句先问</small><strong>{workflow.firstQuestion}</strong></div></header>
      <div className="workflow-steps">{workflow.steps.map((step, index) => <article key={step.title}>
        <div className="workflow-step-number">{String(index + 1).padStart(2, '0')}</div>
        <div className="workflow-step-body"><header><h3>{step.title}</h3><p>{step.question}</p></header><div className="workflow-parameters">{step.parameters.map((parameter) => <span key={parameter}>{parameter}</span>)}</div><div className="workflow-evidence"><small>回到命例核对</small><div>{step.evidence.map((evidence) => {
          const item = caseIndex.get(evidence.caseUid)
          if (!item) return null
          return <button key={`${step.title}-${evidence.caseUid}`} onClick={() => go('case', evidence.caseUid, `workflow-${workflow.id}`)}><strong>{item.printed_label} · {item.title}</strong><span>{evidence.note}</span><ArrowRight size={14} /></button>
        })}</div></div></div>
      </article>)}</div>
      <footer className="workflow-footer"><section><h3>写成这五行</h3><ol>{workflow.outputTemplate.map((item) => <li key={item}>{item}</li>)}</ol></section><section><h3>到这里要收手</h3><ul>{workflow.boundaries.map((item) => <li key={item}>{item}</li>)}</ul></section></footer>
    </section>
  </div>
}

function AdvancedTrainingList({ db, records }: { db: LocalStudyDatabase; records: LocalRecord[] }) {
  const modules = db.query<TrainingModule>('SELECT * FROM training_modules ORDER BY sequence')
  const cards = db.query<TrainingCard>(`SELECT tc.*, c.printed_label, c.title FROM training_cards tc JOIN cases c USING(case_uid) ORDER BY tc.sequence`)
  return (
    <div className="page-stack advanced-training">
      <div className="advanced-notice"><Brain size={22} /><div><strong>这是进阶模式</strong><p>需要独立写判断链。建议先完成同一案例的选择题，再进入这里。</p></div></div>
      {modules.map((module) => {
        const moduleCards = cards.filter((card) => card.module_id === module.module_id)
        const done = moduleCards.filter((card) => records.some((record) => record.id === recordId('training', card.case_uid) && record.completed)).length
        return <section className="module-section" key={module.module_id}>
          <div className="module-heading"><div><span>{String(module.sequence).padStart(2, '0')}</span><div><h2>{module.title}</h2><p>{module.objective}</p></div></div><Badge color={done === moduleCards.length ? 'green' : 'gray'}>{done}/{moduleCards.length}</Badge></div>
          <div className="list-panel">{moduleCards.map((card) => {
            const complete = records.some((record) => record.id === recordId('training', card.case_uid) && record.completed)
            return <button className="list-row" key={card.case_uid} onClick={() => go('training-card', card.case_uid)}><span className={`row-index ${complete ? 'complete' : ''}`}>{complete ? <CheckCircle weight="fill" /> : String(card.sequence).padStart(2, '0')}</span><span className="row-main"><strong>{card.focus}</strong><small>{card.printed_label} · {card.title}</small></span><Badge variant="soft" color="gray">{card.training_mode}</Badge><span className="row-arrow">›</span></button>
          })}</div>
        </section>
      })}
    </div>
  )
}

function QuizView({ db, caseUid, records, reviewWrong = false, onSave }: { db: LocalStudyDatabase; caseUid: string; records: LocalRecord[]; reviewWrong?: boolean; onSave: (record: LocalRecord) => Promise<void> }) {
  const caseData = db.query<CaseDetail>('SELECT * FROM cases WHERE case_uid=?', [caseUid])[0]
  const chart = db.query<Chart>('SELECT * FROM charts WHERE case_uid=? AND length(day_pillar)=2 ORDER BY chart_index LIMIT 1', [caseUid])[0]
  const methods = splitTags(caseData?.methods || '')
  const methodPool = db.query<{ tag: string }>("SELECT tag FROM tags WHERE kind='method' GROUP BY tag ORDER BY COUNT(*) DESC").map((item) => item.tag)
  const existing = records.find((record) => record.id === recordId('quiz', caseUid))
  const questions = caseData && chart ? buildCaseQuiz(caseUid, chart, methods, methodPool) : []
  const storedAnswers = parseQuizAnswers(existing?.body)
  const storedWrongIds = questions.filter((question) => storedAnswers[question.id] && storedAnswers[question.id] !== question.answer).map((question) => question.id)
  const [focusQuestionIds, setFocusQuestionIds] = useState<string[]>(() => reviewWrong ? storedWrongIds : [])
  const [answers, setAnswers] = useState<Record<string, string>>(() => reviewWrong ? Object.fromEntries(Object.entries(storedAnswers).filter(([id]) => !storedWrongIds.includes(id))) : storedAnswers)
  if (!caseData || !chart) return <NotFound />
  const answered = Object.keys(answers).filter((id) => questions.some((question) => question.id === id)).length
  const score = questions.filter((question) => answers[question.id] === question.answer).length
  const complete = answered === questions.length
  const displayQuestions = focusQuestionIds.length ? questions.filter((question) => focusQuestionIds.includes(question.id)) : questions
  const focusAnswered = displayQuestions.filter((question) => Boolean(answers[question.id])).length
  const wrongQuestions = questions.filter((question) => answers[question.id] && answers[question.id] !== question.answer)
  const wrongLabels = [...new Set(wrongQuestions.map((question) => quizSkillFor(question.id).label))]
  const foundationSkill = wrongQuestions.map((question) => quizSkillFor(question.id)).find((skill) => 'foundationFocus' in skill)

  function scrollToQuizTop() {
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }

  function retryWrongQuestions() {
    const ids = wrongQuestions.map((question) => question.id)
    if (!ids.length) return
    setFocusQuestionIds(ids)
    setAnswers((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !ids.includes(id))))
    scrollToQuizTop()
  }

  function restartAll() {
    setFocusQuestionIds([])
    setAnswers({})
    scrollToQuizTop()
  }

  async function choose(questionId: string, option: string) {
    if (answers[questionId]) return
    const nextAnswers = { ...answers, [questionId]: option }
    setAnswers(nextAnswers)
    if (questions.filter((question) => Boolean(nextAnswers[question.id])).length === questions.length) {
      const nextScore = questions.filter((question) => nextAnswers[question.id] === question.answer).length
      await onSave({ id: recordId('quiz', caseUid), kind: 'quiz', caseUid, body: JSON.stringify(nextAnswers), completed: true, quizScore: nextScore, quizTotal: questions.length, updatedAt: new Date().toISOString() })
    }
  }

  return <div className="page-stack detail-page quiz-page"><BackButton to="training" label="返回个人学习" /><section className="quiz-heading"><div><p className="eyebrow">{caseData.printed_label} · {focusQuestionIds.length ? '错题重做' : '基础选择题'}</p><h1>{caseData.title}</h1><p>{focusQuestionIds.length ? `只重做上次的 ${displayQuestions.length} 个错项，已答 ${focusAnswered}/${displayQuestions.length}。` : `已答 ${answered}/${questions.length}，当前答对 ${score} 题。`}题目使用本案例第一张完整命盘。</p></div><Badge color={complete ? 'green' : 'gray'}>{complete ? `${score}/${questions.length}` : focusQuestionIds.length ? '错题重做' : '作答中'}</Badge></section><ChartSection charts={[chart]} showRelations={complete} showLearningHints={complete} />
    <div className="quiz-questions">{displayQuestions.map((question, index) => {
      const selected = answers[question.id]
      return <section className={`quiz-question ${selected ? 'answered' : ''}`} key={question.id}><header><span>{index + 1}</span><h2>{question.prompt}</h2></header><div className="quiz-options">{question.options.map((option) => {
        const state = selected ? option === question.answer ? 'correct' : option === selected ? 'wrong' : '' : ''
        return <button className={state} key={option} disabled={Boolean(selected)} onClick={() => choose(question.id, option)}><span>{option}</span>{state === 'correct' && <Check size={18} weight="bold" />}{state === 'wrong' && <X size={18} weight="bold" />}</button>
      })}</div>{selected && <p className={`quiz-explanation ${selected === question.answer ? 'correct' : 'wrong'}`}>{selected === question.answer ? '答对了。' : `正确答案：${question.answer}。`}{question.explanation}</p>}</section>
    })}</div>
    {complete && <section className="quiz-complete"><CheckCircle size={28} weight="fill" /><div><h2>本组完成：{score}/{questions.length}</h2><p>{wrongLabels.length ? `本次需回看：${wrongLabels.join('、')}。可以只重做错题，也可以先补基础再回到本例。` : '基础事实已全部答对。下一步阅读原文，观察作者如何把这些信息接入判断。'}</p></div><div className="button-row">{wrongQuestions.length > 0 && <Button onClick={retryWrongQuestions}>只重做 {wrongQuestions.length} 道错题</Button>}{foundationSkill && 'foundationFocus' in foundationSkill && <Button variant="soft" color="gray" onClick={() => go('training', 'foundations', foundationSkill.foundationFocus)}><Table size={16} />回看{foundationSkill.label}</Button>}<Button variant={wrongQuestions.length ? 'soft' : 'solid'} color={wrongQuestions.length ? 'gray' : undefined} onClick={() => go('case', caseUid)}>阅读案例原文</Button><Button variant="ghost" color="gray" onClick={restartAll}>全部重做</Button>{!wrongQuestions.length && <Button variant="ghost" color="gray" onClick={() => go('training')}>返回题目列表</Button>}</div></section>}
  </div>
}

function TrainingCardView({ db, caseUid, records, onSave }: { db: LocalStudyDatabase; caseUid: string; records: LocalRecord[]; onSave: (record: LocalRecord) => Promise<void> }) {
  const card = db.query<TrainingCard>(`SELECT tc.*, c.printed_label, c.title FROM training_cards tc JOIN cases c USING(case_uid) WHERE tc.case_uid=?`, [caseUid])[0]
  const caseData = db.query<CaseDetail>('SELECT * FROM cases WHERE case_uid=?', [caseUid])[0]
  const charts = db.query<Chart>('SELECT * FROM charts WHERE case_uid=? ORDER BY chart_index', [caseUid])
  const existing = records.find((item) => item.id === recordId('training', caseUid))
  const [body, setBody] = useState(existing?.body || '')
  const [revealed, setRevealed] = useState(Boolean(existing?.revealed))
  const [saving, setSaving] = useState(false)
  if (!card || !caseData) return <NotFound />
  async function save(reveal = revealed) {
    if (!body.trim()) return
    setSaving(true)
    await onSave({ id: recordId('training', caseUid), kind: 'training', caseUid, body, revealed: reveal, completed: reveal, updatedAt: new Date().toISOString() })
    setRevealed(reveal)
    setSaving(false)
  }
  return <div className="page-stack detail-page">
    <BackButton to="training" label="返回训练路径" />
    <PageIntro eyebrow={`${card.printed_label} · 训练 ${card.sequence}`} title={card.focus} body={card.evidence_lens} />
    <ChartSection charts={charts} masked />
    <section className="section-block"><p className="eyebrow">独立作答</p><h2>先写你的判断链</h2><PromptList items={jsonList(card.prompts_json)} /><TextArea resize="vertical" size="3" value={body} onChange={(e) => setBody(e.target.value)} placeholder="问题限定、角色定位、结构作用、时间与可检验结论……" /><div className="editor-actions"><small>内容只保存在当前浏览器</small><Button disabled={!body.trim() || saving} onClick={() => save(false)} variant="soft">保存草稿</Button><Button disabled={!body.trim() || saving} onClick={() => save(true)}>保存并揭示</Button></div></section>
    {revealed && <RevealPanel card={card} caseData={caseData} />}
  </div>
}

function RevealPanel({ card, caseData }: { card: TrainingCard; caseData: CaseDetail }) {
  return <section className="reveal-panel"><div className="reveal-heading"><CheckCircle size={24} weight="fill" /><div><p className="eyebrow">对照复盘</p><h2>{card.outcome_summary}</h2></div></div><div className="check-grid"><div><h3>核对点</h3><PromptList items={jsonList(card.checkpoints_json)} /></div><div><h3>师傅推理链</h3><PromptList items={jsonList(card.teacher_chain_json)} /></div></div><div className="caution"><strong>易错处</strong><p>{card.caution}</p></div><SourceText title="案例原文" text={caseData.body} />{caseData.detail && <SourceText title="论坛补充" text={caseData.detail} />}</section>
}

type LocalBookFile = { name: string; size: number; url: string }

function LibraryView() {
  const [files, setFiles] = useState<LocalBookFile[]>([])
  const [loading, setLoading] = useState(canLoadProjectDatabase())
  const [groupFilter, setGroupFilter] = useState<'all' | BookGroup>('all')
  const [sortMode, setSortMode] = useState<'learning' | 'year'>('learning')
  const [query, setQuery] = useState('')
  useEffect(() => {
    if (!canLoadProjectDatabase()) return
    fetch('/__local/library.json', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : [])
      .then((items: LocalBookFile[]) => setFiles(items))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false))
  }, [])
  const matchedNames = new Set(REFERENCE_BOOKS.flatMap((book) => files.filter((file) => matchLocalBook(file.name, book)).map((file) => file.name)))
  const unmatched = files.filter((file) => !matchedNames.has(file.name))
  const normalizedQuery = query.trim().toLowerCase()
  const luBooks = REFERENCE_BOOKS.filter((book) => book.group === '陆致极体系')
  const filteredBooks = REFERENCE_BOOKS.filter((book) => groupFilter === 'all' || book.group === groupFilter).filter((book) => !normalizedQuery || `${book.title} ${book.subtitle || ''} ${book.author} ${book.year || ''} ${book.editionNote || ''} ${book.topics.join(' ')}`.toLowerCase().includes(normalizedQuery))

  return <div className="page-stack library-page"><section className="library-heading"><div><p className="eyebrow">参考书架</p><h1>从案例走向文本</h1><p>陆致极著作按独立作品完整收录，另保留古籍与近现代参照。书目用于查证和比较，不会自动改写案例结论。</p></div><div><strong>{REFERENCE_BOOKS.length}</strong><span>核验书目 · 陆致极 {luBooks.length} 部</span></div></section>
    {canLoadProjectDatabase() ? <section className="library-local-note"><FolderOpen size={22} /><div><strong>本地书籍目录</strong><code>E:\Claude code\bazi\library</code><p>{loading ? '正在检测文件。' : files.length ? '已检测到本地文件，点击“本机阅读”即可打开。支持按作者建立子目录。' : '暂未检测到电子书。把合法持有的文件放入此目录或子目录，再重新打开网站。'}</p></div></section> : <section className="library-local-note"><Books size={22} /><div><strong>当前是远程或手机访问</strong><p>出于隐私保护，本地书籍不会通过局域网或公开网页传输。</p></div></section>}
    <section className="library-bibliography-note"><CheckCircle size={22} weight="fill" /><div><strong>需购入实体书后阅读</strong><p>本站只整理书目、版本关系与学习顺序，不提供电子书正文；“完整”按 15 部独立作品计算，简繁版与再版不重复计数。</p></div></section>
    <section className="library-reading-path"><article><span>01</span><div><strong>先建立骨架</strong><p>基础表 + 入门 14 例 +《基础教程》。</p></div></article><article><span>02</span><div><strong>带着问题查书</strong><p>遇到格局、调候或动态问题，再查对应专题。</p></div></article><article><span>03</span><div><strong>比较而非混用</strong><p>古籍与注家只作对照，结论仍回到案例证据。</p></div></article></section>
    <div className="library-tools"><div className="library-tool-main"><div className="library-filter-tabs"><button className={groupFilter === 'all' ? 'active' : ''} onClick={() => setGroupFilter('all')}>全部 {REFERENCE_BOOKS.length}</button>{BOOK_GROUPS.map((group) => <button className={groupFilter === group.id ? 'active' : ''} key={group.id} onClick={() => setGroupFilter(group.id)}>{group.id} {REFERENCE_BOOKS.filter((book) => book.group === group.id).length}</button>)}</div><div className="library-sort"><span>排列</span><button className={sortMode === 'learning' ? 'active' : ''} onClick={() => setSortMode('learning')}>学习顺序</button><button className={sortMode === 'year' ? 'active' : ''} onClick={() => setSortMode('year')}>出版脉络</button></div></div><label className="quiz-search"><MagnifyingGlass size={16} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索书名、年份、作者或主题" /></label></div>
    {BOOK_GROUPS.map((group) => {
      const groupBooks = filteredBooks.filter((book) => book.group === group.id).sort((a, b) => sortMode === 'learning' ? a.order - b.order : (Number(a.year?.match(/\d{4}/)?.[0]) || 9999) - (Number(b.year?.match(/\d{4}/)?.[0]) || 9999) || a.order - b.order)
      if (!groupBooks.length) return null
      return <section className="book-group" key={group.id}><header><h2>{group.id}</h2><p>{group.description}</p></header><div>{groupBooks.map((book, index) => {
      const localFiles = files.filter((file) => matchLocalBook(file.name, book))
      return <article className="book-row" key={book.id}><div className="book-order">{String(index + 1).padStart(2, '0')}</div><div className="book-main"><div className="book-title-line"><div><h3>{book.title}</h3>{book.subtitle && <p className="book-subtitle">{book.subtitle}</p>}</div><Badge variant="soft" color={book.level === '入门' ? 'green' : book.level === '进阶' ? 'orange' : 'gray'}>{book.level}</Badge></div><small className="book-author">{book.author}{book.year ? ` · ${book.year}` : ''}</small>{book.editionNote && <p className="book-edition">版本关系：{book.editionNote}</p>}<p>{book.note}</p>{book.caution && <p className="book-caution">阅读提示：{book.caution}</p>}<div className="book-topics">{book.topics.map((topic) => <span key={topic}>{topic}</span>)}</div><div className="book-actions"><a href={book.sourceUrl} target="_blank" rel="noreferrer">{book.sourceLabel}<ArrowRight size={14} /></a>{localFiles.map((file) => <a className="local-book" href={file.url} target="_blank" rel="noreferrer" key={file.name}><FilePdf size={15} />本机阅读 · {formatBytes(file.size)}</a>)}</div></div><Badge color={localFiles.length ? 'green' : 'gray'}>{localFiles.length ? '本机可读' : '未添加'}</Badge></article>
    })}</div></section>
    })}
    {!filteredBooks.length && <div className="quiz-empty"><Books size={27} /><h3>没有匹配的书目</h3><p>换一个作者、书名或主题试试。</p></div>}
    {unmatched.length > 0 && <section className="book-group unmatched-books"><header><h2>其他本地文件</h2><p>文件名未与上方书目自动对应。</p></header><div>{unmatched.map((file) => <a href={file.url} target="_blank" rel="noreferrer" key={file.name}><FilePdf size={17} /><span>{file.name}</span><small>{formatBytes(file.size)}</small></a>)}</div></section>}
  </div>
}

function RulesView({ db }: { db: LocalStudyDatabase }) {
  const families = db.query<RuleFamily>('SELECT * FROM rule_families ORDER BY sequence')
  const rules = db.query<RuleSummary>(`SELECT r.*, f.title family_title,
    (SELECT COUNT(*) FROM rule_case_evidence e WHERE e.rule_id=r.rule_id) evidence_count,
    (SELECT COUNT(*) FROM rule_holdouts h WHERE h.rule_id=r.rule_id) holdout_count
    FROM learning_rules r JOIN rule_families f USING(family_id) ORDER BY f.sequence, r.sequence`)
  return <div className="page-stack">
    <PageIntro eyebrow="十二条可检验命题" title="规则是暂定的，证据关系不是含糊的。" body="当前以 B、C 级为主。每条规则都保留适用范围、边界条件、竞争解释、案例证据与两例未参与归纳的盲测样本。" />
    <div className="legend-line"><Badge color="orange">B 级</Badge><span>跨案例支持，仍需继续检验</span><Badge color="gray">C 级</Badge><span>工作假设，暂不外推</span></div>
    {families.map((family) => <section className="family-section" key={family.family_id}><div className="family-heading"><span>{family.family_id}</span><div><h2>{family.title}</h2><p>{family.question}</p></div></div><div className="rule-card-grid">{rules.filter((rule) => rule.family_id === family.family_id).map((rule) => <button className="rule-card" key={rule.rule_id} onClick={() => go('rule', rule.rule_id)}><div><Badge color={rule.status === 'B' ? 'orange' : 'gray'}>{rule.status} 级</Badge><span>{rule.rule_id}</span></div><h3>{rule.statement}</h3><p>{rule.scope}</p><footer><span>{rule.evidence_count} 条证据</span><span>{rule.holdout_count} 例预留</span></footer></button>)}</div></section>)}
  </div>
}

function RuleView({ db, ruleId, records }: { db: LocalStudyDatabase; ruleId: string; records: LocalRecord[] }) {
  const rule = db.query<RuleSummary>(`SELECT r.*, f.title family_title,
    (SELECT COUNT(*) FROM rule_case_evidence e WHERE e.rule_id=r.rule_id) evidence_count,
    (SELECT COUNT(*) FROM rule_holdouts h WHERE h.rule_id=r.rule_id) holdout_count
    FROM learning_rules r JOIN rule_families f USING(family_id) WHERE r.rule_id=?`, [ruleId])[0]
  const evidence = db.query<RuleEvidence>(`SELECT e.*, rt.name relation_name, tt.name timing_name, c.printed_label, c.title case_title
    FROM rule_case_evidence e JOIN rule_relation_types rt ON rt.code=e.relation JOIN rule_timing_types tt ON tt.code=e.timing JOIN cases c USING(case_uid)
    WHERE e.rule_id=? ORDER BY e.evidence_index`, [ruleId])
  const holdouts = db.query<RuleHoldout>('SELECT * FROM rule_holdouts WHERE rule_id=? ORDER BY holdout_index', [ruleId])
  if (!rule) return <NotFound />
  return <div className="page-stack detail-page"><BackButton to="rules" label="返回规则总览" />
    <section className="rule-hero"><div><Badge color={rule.status === 'B' ? 'orange' : 'gray'}>{rule.status} 级暂定</Badge><span>{rule.rule_id} · {rule.family_title}</span></div><h1>{rule.statement}</h1><p>{rule.scope}</p></section>
    <section className="split-grid"><div className="section-block compact-block"><p className="eyebrow">可检验预测</p><h2>{rule.prediction}</h2></div><div className="section-block compact-block"><p className="eyebrow">进入条件</p><PromptList items={jsonList(rule.prerequisites_json)} /></div></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">证据账本</p><h2>{evidence.length} 条关联记录</h2></div></div><div className="evidence-list">{evidence.map((item) => <article key={item.evidence_index}><header><button onClick={() => go('case', item.case_uid)}>{item.printed_label} · {item.case_title}</button><span><Badge color={relationColor(item.relation)}>{item.relation_name}</Badge><Badge variant="soft" color="gray">{item.timing_name}</Badge></span></header><blockquote>{item.source_text}</blockquote><p>{item.note}</p><small>{item.source_locator}</small></article>)}</div></section>
    <section className="section-block"><p className="eyebrow">边界与竞争解释</p><div className="check-grid"><div><h2>何时降低信心</h2><PromptList items={jsonList(rule.boundary_conditions_json)} /></div><div><h2>还可能是什么</h2><PromptList items={jsonList(rule.competing_explanations_json)} /></div></div></section>
    <section className="holdout-panel"><div><p className="eyebrow">真正的下一步</p><h2>用未参与归纳的案例盲测</h2><p>只先展示命盘，不展示标题、原文与结果。写下判断后再揭示，并保留记录。</p></div><div className="holdout-list">{holdouts.map((item) => {
      const done = records.some((record) => record.id === recordId('blind', item.case_uid, ruleId) && record.completed)
      return <button key={item.case_uid} onClick={() => go('blind', ruleId, item.case_uid)}><span>{String(item.holdout_index).padStart(2, '0')}</span><div><strong>{done ? '已完成盲测' : '预留案例'}</strong><small>{done ? '可再次复盘' : '未揭示资料'}</small></div>{done && <CheckCircle weight="fill" />}</button>
    })}</div></section>
  </div>
}

function relationColor(relation: string): 'green' | 'orange' | 'red' | 'gray' | 'blue' {
  if (relation === 'support') return 'green'
  if (relation === 'partial') return 'orange'
  if (relation === 'contradict') return 'red'
  if (relation === 'competing') return 'blue'
  return 'gray'
}

function BlindView({ db, ruleId, caseUid, records, onSave }: { db: LocalStudyDatabase; ruleId: string; caseUid: string; records: LocalRecord[]; onSave: (record: LocalRecord) => Promise<void> }) {
  const rule = db.query<RuleSummary>(`SELECT r.*, f.title family_title, 0 evidence_count, 0 holdout_count FROM learning_rules r JOIN rule_families f USING(family_id) WHERE r.rule_id=?`, [ruleId])[0]
  const caseData = db.query<CaseDetail>('SELECT * FROM cases WHERE case_uid=?', [caseUid])[0]
  const charts = db.query<Chart>('SELECT * FROM charts WHERE case_uid=? ORDER BY chart_index', [caseUid])
  const existing = records.find((item) => item.id === recordId('blind', caseUid, ruleId))
  const [body, setBody] = useState(existing?.body || '')
  const [revealed, setRevealed] = useState(Boolean(existing?.revealed))
  if (!rule || !caseData) return <NotFound />
  async function reveal() {
    if (!body.trim()) return
    await onSave({ id: recordId('blind', caseUid, ruleId), kind: 'blind', ruleId, caseUid, body, revealed: true, completed: true, updatedAt: new Date().toISOString() })
    setRevealed(true)
  }
  return <div className="page-stack detail-page"><BackButton to="rule" id={ruleId} label={`返回 ${ruleId}`} />
    <section className="blind-banner"><div><Badge color="red">盲测中</Badge><span>预留案例 · 资料未揭示</span></div><h1>{rule.prediction}</h1><p>请判断本例是否符合规则、信心等级、可能的竞争解释，以及你希望看到什么反馈来证伪。</p></section>
    <ChartSection charts={charts} masked />
    <section className="section-block"><p className="eyebrow">盲测记录</p><h2>在看答案之前，留下可追溯判断</h2><TextArea resize="vertical" size="3" value={body} onChange={(e) => setBody(e.target.value)} placeholder="是否支持：\n依据：\n信心：\n反证条件：" /><div className="editor-actions"><small>揭示后仍可修改，但系统会保留更新时间</small><Button disabled={!body.trim()} onClick={reveal}>{revealed ? '更新记录' : '保存并揭示案例'}</Button></div></section>
    {revealed && <section className="reveal-panel"><div className="reveal-heading"><CheckCircle size={24} weight="fill" /><div><p className="eyebrow">资料已揭示</p><h2>{caseData.printed_label} · {caseData.title}</h2></div></div><SourceText title="案例原文" text={caseData.body} />{caseData.detail && <SourceText title="论坛补充" text={caseData.detail} />}<Button variant="soft" onClick={() => go('case', caseUid)}>打开完整案例页</Button></section>}
  </div>
}

function CasesView({ db, records, initialWorkflowId }: { db: LocalStudyDatabase; records: LocalRecord[]; initialWorkflowId?: string }) {
  const workflowContext = TOPIC_WORKFLOWS.find((item) => item.id === initialWorkflowId)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SmartFilters>({ ...EMPTY_FILTERS, dayStems: [], dayPillars: [], topics: workflowContext ? [workflowContext.topic] : [], methods: [], views: [] })
  const cases = db.query<CaseSearchDocument>('SELECT section_index, case_uid, printed_label, title, gender, day_stem, day_pillar, chart_count, topics, methods, has_detail, body, detail FROM cases ORDER BY section_index')
  const topics = db.query<{ tag: string }>("SELECT tag FROM tags WHERE kind='topic' GROUP BY tag ORDER BY COUNT(*) DESC, tag").map((row) => row.tag)
  const methods = db.query<{ tag: string }>("SELECT tag FROM tags WHERE kind='method' GROUP BY tag ORDER BY COUNT(*) DESC, tag").map((row) => row.tag)
  const parsed = useMemo(() => parseSmartQuery(query, topics, methods), [query, topics.join('|'), methods.join('|')])
  const matches = useMemo(() => searchCases(cases, filters, parsed), [cases, filters, parsed])
  const due = dueCaseRecords(records)
  const activeCount = filters.dayStems.length + filters.dayPillars.length + filters.topics.length + filters.methods.length + filters.views.length + (filters.gender ? 1 : 0)
  const hasCriteria = Boolean(query.trim() || activeCount)
  useEffect(() => {
    setQuery('')
    setFilters({ ...EMPTY_FILTERS, dayStems: [], dayPillars: [], topics: workflowContext ? [workflowContext.topic] : [], methods: [], views: [] })
  }, [initialWorkflowId])

  function toggleFilter(key: 'dayStems' | 'topics' | 'methods' | 'views', value: string) {
    setFilters((current) => {
      const values = current[key] as string[]
      return { ...current, [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value] }
    })
  }

  function clearSearch() {
    setQuery('')
    setFilters({ ...EMPTY_FILTERS, dayStems: [], dayPillars: [], topics: [], methods: [], views: [] })
  }

  function beginPractice(caseUid?: string) {
    const target = caseUid || matches[Math.floor(Math.random() * matches.length)]?.item.case_uid
    if (target) go('practice', target, Date.now().toString(36))
  }

  return <div className="page-stack search-page">
    {workflowContext && <section className="workflow-context"><div><ListChecks size={20} /><span><small>来自专题步骤</small><strong>{workflowContext.title} · {workflowContext.topic}</strong></span></div><Button size="1" variant="ghost" color="gray" onClick={() => go('training', 'workflows', workflowContext.id)}><ArrowLeft size={14} />返回步骤</Button></section>}
    <section className="search-intro">
      <div><p className="eyebrow">本地可解释检索</p><h1>把条件写出来，系统告诉你它如何理解。</h1><p>日主、四柱、性别、主题、方法和学习视图可组合查询。所有匹配都来自本机数据库。</p></div>
      <div className="search-actions"><Button onClick={() => beginPractice()} disabled={!matches.length}><Shuffle size={18} />随机盲练</Button><Button variant="soft" color="gray" disabled={!due.length} onClick={() => beginPractice(due[0]?.caseUid)}><CalendarCheck size={18} />到期复习 {due.length || ''}</Button></div>
    </section>

    <section className="search-workbench">
      <label className="search-label" htmlFor="smart-search">自然条件</label>
      <div className="smart-search-row">
        <TextField.Root id="smart-search" size="3" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：甲木 女命 婚姻 合局 只看反馈"><TextField.Slot><Sparkle size={18} /></TextField.Slot>{query && <TextField.Slot><IconButton size="1" variant="ghost" color="gray" aria-label="清空输入" title="清空输入" onClick={() => setQuery('')}><X size={15} /></IconButton></TextField.Slot>}</TextField.Root>
      </div>
      <p className="search-helper">支持例号、原文关键词，以及“甲木、女命、婚姻、合局、墓库、伤官、只看反馈”等条件。</p>
      {parsed.recognized.length > 0 && <div className="recognized-query"><span>已识别</span><div>{parsed.recognized.map((item) => <Badge key={item} variant="soft" color="red">{item}</Badge>)}</div></div>}

      <div className="learning-views" aria-label="学习视图">
        <span>快速视图</span>
        <button className={filters.views.includes('feedback') ? 'active' : ''} onClick={() => toggleFilter('views', 'feedback')}>只看反馈</button>
        <button className={filters.views.includes('failure') ? 'active' : ''} onClick={() => toggleFilter('views', 'failure')}>只看失误</button>
        <button className={filters.views.includes('timing') ? 'active' : ''} onClick={() => toggleFilter('views', 'timing')}>只看定时依据</button>
      </div>

      <details className="filter-disclosure">
        <summary><span><FunnelSimple size={17} />结构化筛选 {activeCount > 0 && <Badge color="red">{activeCount}</Badge>}</span><CaretDown size={16} /></summary>
        <div className="filter-groups">
          <FilterGroup label="日主" options={[...DAY_STEMS]} selected={filters.dayStems} onToggle={(value) => toggleFilter('dayStems', value)} />
          <div className="filter-group"><span>性别</span><div><button className={!filters.gender ? 'active' : ''} onClick={() => setFilters((current) => ({ ...current, gender: '' }))}>不限</button>{(['男', '女', '未标注'] as const).map((value) => <button key={value} className={filters.gender === value ? 'active' : ''} onClick={() => setFilters((current) => ({ ...current, gender: value }))}>{value}</button>)}</div></div>
          <FilterGroup label="主题" options={topics} selected={filters.topics} onToggle={(value) => toggleFilter('topics', value)} />
          <FilterGroup label="方法与结构" options={methods} selected={filters.methods} onToggle={(value) => toggleFilter('methods', value)} />
        </div>
      </details>
    </section>

    <div className="search-result-heading"><div><strong>{matches.length}</strong><span>个匹配案例</span>{hasCriteria && <small>组合条件同时满足</small>}</div>{hasCriteria && <Button size="1" variant="ghost" color="gray" onClick={clearSearch}>清除全部条件</Button>}</div>
    <div className="case-grid">{matches.map(({ item, reasons }) => <button className="case-card" key={item.case_uid} onClick={() => go('case', item.case_uid, workflowContext ? `workflow-${workflowContext.id}` : undefined)}><header><span>{item.printed_label}</span><small>{item.day_pillar || '日柱未识别'}</small></header><h2>{item.title}</h2>{hasCriteria ? <div className="match-reasons">{reasons.map((reason) => <span key={reason}>{reason}</span>)}</div> : <div className="tag-line">{splitTags(item.topics).slice(0, 3).map((tag) => <Badge key={tag} variant="soft" color="gray">{tag}</Badge>)}</div>}<footer><span>{item.gender ? `${item.gender}命` : '性别未标注'}</span><span>{item.has_detail ? '含论坛补充' : `${item.chart_count} 盘`}</span></footer></button>)}</div>
    {!matches.length && <EmptyState title="组合条件没有命中" body="系统没有放宽条件。可以移除一个主题、方法或学习视图后再试。" />}
  </div>
}

function FilterGroup({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div className="filter-group"><span>{label}</span><div>{options.map((value) => <button key={value} className={selected.includes(value) ? 'active' : ''} onClick={() => onToggle(value)}>{value}</button>)}</div></div>
}

function PracticeView({ db, caseUid, attemptId, records, onSave }: { db: LocalStudyDatabase; caseUid: string; attemptId: string; records: LocalRecord[]; onSave: (record: LocalRecord) => Promise<void> }) {
  const caseData = db.query<CaseDetail>('SELECT * FROM cases WHERE case_uid=?', [caseUid])[0]
  const topicWorkflow = TOPIC_WORKFLOWS.find((item) => attemptId.startsWith(`topic-${item.id}-`))
  const charts = db.query<Chart>(`SELECT * FROM charts WHERE case_uid=? ${topicWorkflow ? "AND chart_type='natal_bazi'" : ''} ORDER BY chart_index`, [caseUid])
  const topicCases = topicWorkflow ? availableTopicCases(db, topicWorkflow.topic) : []
  const practiceId = recordId('practice', caseUid, attemptId)
  const existingAttempt = records.find((item) => item.id === practiceId)
  const caseRecord = records.find((item) => item.id === recordId('case', caseUid))
  const [body, setBody] = useState(existingAttempt?.body || '')
  const [revealed, setRevealed] = useState(Boolean(existingAttempt?.revealed))
  const [scheduled, setScheduled] = useState(caseRecord?.nextReviewAt || '')
  if (!caseData) return <NotFound />

  async function reveal() {
    if (!body.trim()) return
    await onSave({ id: practiceId, kind: 'practice', caseUid, body, revealed: true, completed: true, updatedAt: new Date().toISOString() })
    setRevealed(true)
  }

  async function scheduleReview(confidence: number) {
    const now = new Date().toISOString()
    const next = calculateNextReviewAt(confidence)
    await onSave({
      id: recordId('case', caseUid),
      kind: 'case',
      caseUid,
      body: caseRecord?.body || '',
      completed: Boolean(caseRecord?.body),
      reviewCount: (caseRecord?.reviewCount || 0) + 1,
      confidence,
      lastReviewedAt: now,
      nextReviewAt: next,
      updatedAt: now,
    })
    setScheduled(next)
  }

  function nextTopicPractice() {
    if (!topicWorkflow) return
    const practicedCaseIds = new Set(records.filter((record) => record.kind === 'practice' && record.completed && record.id.includes(`:topic-${topicWorkflow.id}-`)).map((record) => record.caseUid))
    const unseen = topicCases.filter((item) => item.case_uid !== caseUid && !practicedCaseIds.has(item.case_uid))
    const alternatives = topicCases.filter((item) => item.case_uid !== caseUid)
    const pool = unseen.length ? unseen : alternatives.length ? alternatives : topicCases
    const target = pool[Math.floor(Math.random() * pool.length)]
    if (target) go('practice', target.case_uid, `topic-${topicWorkflow.id}-${Date.now().toString(36)}`)
  }

  const practicePrompts = topicWorkflow ? topicWorkflow.outputTemplate : ['先限定问题或判断范围', '指出关键干支、十神与作用关系', '写出结果、时间依据和信心等级', '列出至少一个竞争解释或反证条件']
  const practicePlaceholder = topicWorkflow ? topicWorkflow.outputTemplate.map((item) => `${item}：`).join('\n') : '范围：\n结构：\n判断：\n时间：\n反证条件：'

  return <div className="page-stack detail-page">
    <BackButton to={topicWorkflow ? 'training' : 'cases'} id={topicWorkflow ? 'workflows' : undefined} secondaryId={topicWorkflow?.id} label={topicWorkflow ? `返回${topicWorkflow.title}` : '返回智能检索'} />
    <section className="blind-banner"><div><Badge color="red">{topicWorkflow ? `${topicWorkflow.title} · 专题盲练` : '独立判断'}</Badge><span>案例标题与原文暂未显示</span></div><h1>{topicWorkflow ? `只看命盘，按 ${topicWorkflow.steps.length} 步完成一次专题判断。` : '只看命盘，先写下结构、角色与可检验结论。'}</h1><p>{topicWorkflow ? topicWorkflow.firstQuestion : '不要求一次断准。重点是让判断发生在反馈之前，之后才能看见自己真正的偏差。'}</p></section>
    <ChartSection charts={charts} masked />
    <section className="section-block"><p className="eyebrow">盲练记录</p><h2>{topicWorkflow ? `${topicWorkflow.title}判断模板` : '你的判断链'}</h2><PromptList items={practicePrompts} /><TextArea resize="vertical" size="3" value={body} onChange={(event) => setBody(event.target.value)} placeholder={practicePlaceholder} /><div className="editor-actions"><small>保存后才会揭示案例资料</small><Button disabled={!body.trim()} onClick={reveal}>{revealed ? '更新判断' : '保存并揭示'}</Button></div></section>
    {revealed && <section className="reveal-panel"><div className="reveal-heading"><CheckCircle size={24} weight="fill" /><div><p className="eyebrow">资料已揭示</p><h2>{caseData.printed_label} · {caseData.title}</h2></div></div>{topicWorkflow && <section className="topic-practice-review"><div><h3>先对照结构，不计算“神准”</h3><p>逐项检查自己有没有写出定位、作用关系、时间与反证，再读原文。</p></div><ul>{topicWorkflow.boundaries.map((item) => <li key={item}>{item}</li>)}</ul></section>}<SourceText title="案例原文" text={caseData.body} />{caseData.detail && <SourceText title="论坛补充" text={caseData.detail} />}<div className="review-decision"><div><h3>这次掌握到什么程度？</h3><p>选择后会按 1、3、7、14 或 30 天安排下一次复习。</p></div><div>{REVIEW_LEVELS.map((level) => <button key={level.confidence} onClick={() => scheduleReview(level.confidence)}><strong>{level.confidence}</strong><span>{level.label}</span><small>{level.days}天后</small></button>)}</div>{scheduled && <p className="review-confirmation"><CalendarCheck size={17} />下次复习：{new Date(scheduled).toLocaleDateString('zh-CN')}</p>}</div><div className="button-row">{topicWorkflow && <Button onClick={nextTopicPractice}><Shuffle size={16} />再练同专题一例</Button>}<Button variant="soft" color="gray" onClick={() => go('case', caseUid, topicWorkflow ? `workflow-${topicWorkflow.id}` : undefined)}>打开完整案例页</Button>{topicWorkflow && <Button variant="ghost" color="gray" onClick={() => go('training', 'workflows', topicWorkflow.id)}>返回专题步骤</Button>}</div></section>}
  </div>
}

function CaseView({ db, caseUid, records, onSave, source }: { db: LocalStudyDatabase; caseUid: string; records: LocalRecord[]; onSave: (record: LocalRecord) => Promise<void>; source?: string }) {
  const data = db.query<CaseDetail>('SELECT * FROM cases WHERE case_uid=?', [caseUid])[0]
  const charts = db.query<Chart>('SELECT * FROM charts WHERE case_uid=? ORDER BY chart_index', [caseUid])
  const evidence = db.query<{ rule_id: string; relation_name: string; relation: string }>(`SELECT e.rule_id, rt.name relation_name, e.relation FROM rule_case_evidence e JOIN rule_relation_types rt ON rt.code=e.relation WHERE e.case_uid=? ORDER BY e.rule_id`, [caseUid])
  const existing = records.find((item) => item.id === recordId('case', caseUid))
  const [note, setNote] = useState(existing?.body || '')
  const [saved, setSaved] = useState(false)
  const [scheduled, setScheduled] = useState(existing?.nextReviewAt || '')
  const sourceWorkflow = source?.startsWith('workflow-') ? TOPIC_WORKFLOWS.find((item) => item.id === source.slice('workflow-'.length)) : undefined
  if (!data) return <NotFound />
  async function saveNote() {
    await onSave({ ...existing, id: recordId('case', caseUid), kind: 'case', caseUid, body: note, completed: Boolean(note.trim()), updatedAt: new Date().toISOString() })
    setSaved(true)
  }
  async function scheduleReview(confidence: number) {
    const now = new Date().toISOString()
    const next = calculateNextReviewAt(confidence)
    await onSave({ ...existing, id: recordId('case', caseUid), kind: 'case', caseUid, body: note, completed: Boolean(note.trim()), reviewCount: (existing?.reviewCount || 0) + 1, confidence, lastReviewedAt: now, nextReviewAt: next, updatedAt: now })
    setScheduled(next)
    setSaved(true)
  }
  return <div className="page-stack detail-page"><BackButton to={sourceWorkflow ? 'training' : 'cases'} id={sourceWorkflow ? 'workflows' : undefined} secondaryId={sourceWorkflow?.id} label={sourceWorkflow ? `返回${sourceWorkflow.title}` : '返回案例文库'} />
    <section className="case-hero"><div><span>{data.printed_label}</span><span>{data.case_uid}</span>{data.gender && <span>{data.gender}</span>}</div><h1>{data.title}</h1><div className="tag-line">{splitTags(data.topics).map((tag) => <Badge key={tag} variant="soft" color="gray">{tag}</Badge>)}</div></section>
    <ChartSection charts={charts} />
    {evidence.length > 0 && <section className="rule-links"><p className="eyebrow">关联规则证据</p><div>{evidence.map((item) => <button key={item.rule_id} onClick={() => go('rule', item.rule_id)}><strong>{item.rule_id}</strong><Badge color={relationColor(item.relation)}>{item.relation_name}</Badge></button>)}</div></section>}
    <SourceText title="案例原文" text={data.body} />
    {data.detail && <SourceText title="论坛补充" text={data.detail} />}
    <section className="section-block note-editor"><div className="section-heading"><div><p className="eyebrow">我的案头笔记</p><h2>把看懂，变成能复述</h2></div><NotePencil size={24} /></div><TextArea resize="vertical" size="3" value={note} onChange={(e) => { setNote(e.target.value); setSaved(false) }} placeholder="我的判断、与原文的差异、仍不理解之处……" /><div className="editor-actions"><small>{saved ? '已保存在本机' : '未上传到任何服务器'}</small><Button onClick={saveNote}>保存笔记</Button></div><div className="review-decision compact"><div><h3>安排间隔复习</h3><p>{scheduled ? `当前计划：${new Date(scheduled).toLocaleDateString('zh-CN')}` : '按掌握度安排下一次复习，记录会进入智能检索页的到期队列。'}</p></div><div>{REVIEW_LEVELS.map((level) => <button key={level.confidence} onClick={() => scheduleReview(level.confidence)}><strong>{level.confidence}</strong><span>{level.label}</span><small>{level.days}天后</small></button>)}</div></div></section>
  </div>
}

function ChartSection({ charts, masked = false, showRelations, showLearningHints }: { charts: Chart[]; masked?: boolean; showRelations?: boolean; showLearningHints?: boolean }) {
  const chartTypeLabel = (type: string) => type === 'natal_bazi' ? '本命八字' : type === 'event_time' ? '时空八字' : type === 'liuren_time' ? '六壬时间盘' : type
  const relationHintsVisible = showRelations ?? !masked
  const learningHintsVisible = showLearningHints ?? !masked
  return <section className="chart-section"><div className="section-heading"><div><p className="eyebrow">命盘</p><h2>{charts.length > 1 ? `${charts.length} 组四柱` : '四柱排布'}</h2></div>{masked && <Badge variant="soft" color="gray">其余资料已遮蔽</Badge>}</div><div className="chart-list">{charts.map((chart) => {
    const relations = detectChartRelations(chart)
    const foundations = summarizeChartFoundations(chart)
    return <div className="chart-with-relations" key={chart.chart_id}><div className="chart-board"><header><span>{chartTypeLabel(chart.chart_type)}</span>{chart.gender && <span>{chart.gender}</span>}</header><div className="pillars"><Pillar label="年" value={chart.year_pillar} /><Pillar label="月" value={chart.month_pillar} /><Pillar label="日" value={chart.day_pillar} active /><Pillar label="时" value={chart.hour_pillar} /></div></div>{learningHintsVisible && foundations.dayMaster.stem && <details className="chart-foundations"><summary><span>展开基础拆解</span><small>日主 · 藏干 · 纳音 · 明透十神</small><CaretDown size={15} /></summary><div className="chart-foundation-grid"><article><small>日主</small><strong>{foundations.dayMaster.stem}</strong><span>{foundations.dayMaster.polarity}{foundations.dayMaster.element}</span></article><article><small>月支藏干</small><strong>{foundations.monthBranch.branch}</strong><span>{foundations.monthBranch.hiddenStems.join('、')}</span></article><article><small>日支藏干</small><strong>{foundations.dayBranch.branch}</strong><span>{foundations.dayBranch.hiddenStems.join('、')}</span></article><article><small>日柱纳音</small><strong>{foundations.dayNayin}</strong><span>{chart.day_pillar}</span></article></div><div className="visible-ten-gods"><small>明透天干相对日主</small><div>{foundations.visibleTenGods.map((item) => <span key={item.position}><b>{item.position}{item.stem}</b><em>{item.tenGod}</em></span>)}</div></div><footer>这里只拆解可直接核对的基础事实；十神名称不等于旺衰、喜忌或事件结论。</footer></details>}{relationHintsVisible && relations.length > 0 && <details className="chart-relations"><summary><span>展开干支关系提示</span><small>{relations.length} 项基础关系</small><CaretDown size={15} /></summary><div>{relations.map((relation) => <article key={relation.id}><header><Badge variant="soft" color={relation.scope === '天干' ? 'orange' : 'gray'}>{relation.scope}</Badge><strong>{relation.type}</strong></header><p><b>{relation.members}</b>{relation.result && <span>{relation.result}</span>}</p><small>{relation.locations.join('、')}</small></article>)}</div><footer>这里只识别表内结构，不直接判断吉凶；同一对地支可能在不同关系表中重复出现。</footer></details>}</div>
  })}</div>{!charts.length && <p className="muted">本例未识别出完整四柱。</p>}</section>
}

function Pillar({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return <div className={active ? 'active' : ''}><span>{label}柱</span><strong>{value}</strong></div>
}

function PageIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <section className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{body}</p></section>
}

function PromptList({ items }: { items: string[] }) {
  return <ul className="prompt-list">{items.map((item, index) => <li key={`${index}-${item}`}><span>{index + 1}</span><p>{item}</p></li>)}</ul>
}

function SourceText({ title, text }: { title: string; text: string }) {
  return <section className="source-text"><div><p className="eyebrow">原始资料</p><h2>{title}</h2></div><div className="prose">{text}</div></section>
}

function BackButton({ to, id, secondaryId, label }: { to: RouteName; id?: string; secondaryId?: string; label: string }) {
  return <button className="back-button" onClick={() => go(to, id, secondaryId)}><ArrowLeft size={17} />{label}</button>
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="empty-state"><MagnifyingGlass size={28} /><h2>{title}</h2><p>{body}</p></div>
}

function NotFound() {
  return <EmptyState title="没有找到这条记录" body="数据库可能已更新，请返回上一层重新选择。" />
}

export default App
