'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { type RendererOptions } from '@/lib/markdown'
import { useAutoSave } from './hooks/useAutoSave'
import { EditorToolbar } from './components/EditorToolbar'
import { EditorPreview } from './components/EditorPreview'
import { MarkdownToolbar } from './components/MarkdownToolbar'
import { type PreviewSize } from './constants'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { codeThemes, type CodeThemeId } from '@/config/code-themes'
import '@/styles/code-themes.css'
import { templates } from '@/config/wechat-templates'
import { cn } from '@/lib/utils'
import { usePreviewContent } from './hooks/usePreviewContent'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { useScrollSync } from './hooks/useScrollSync'
import { useWordStats } from './hooks/useWordStats'
import { useCopy } from './hooks/useCopy'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { MobileEditor } from './components/MobileEditor'
import { DesktopEditor } from './components/DesktopEditor'
import { getExampleContent } from '@/lib/utils/loadExampleContent'
import { useAuth } from '@/lib/auth/context'
import { getArticles, getArticle, createArticle, updateArticle, deleteArticle } from '@/lib/api/articles'

interface Article {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function WechatEditor() {
  const { toast } = useToast()
  const { user, isLoggedIn } = useAuth()
  const editorRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  
  // 状态管理
  const [value, setValue] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default')
  const [showPreview, setShowPreview] = useState(true)
  const [styleOptions, setStyleOptions] = useState<RendererOptions>({})
  const [previewSize, setPreviewSize] = useState<PreviewSize>('medium')
  const [isDraft, setIsDraft] = useState(false)
  const [codeTheme, setCodeTheme] = useLocalStorage<CodeThemeId>('code-theme', codeThemes[0].id)
  const [articles, setArticles] = useState<Article[]>([])
  const [currentArticleId, setCurrentArticleId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)

  // 使用自定义 hooks
  const { handleEditorChange } = useAutoSave(value, setIsDraft, currentArticleId)
  const { handleEditorScroll } = useScrollSync()

  // 清除编辑器内容
  const handleClear = useCallback(() => {
    if (window.confirm('确定要清除所有内容吗？')) {
      setValue('')
      handleEditorChange('')
      toast({
        title: "已清除",
        description: "编辑器内容已清除",
        duration: 2000
      })
    }
  }, [handleEditorChange, toast])

  // 手动保存
  const handleSave = useCallback(async () => {
    if (!isLoggedIn) {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "请先登录",
        duration: 3000
      })
      return
    }

    try {
      setIsLoading(true)
      if (currentArticleId) {
        // 更新现有文章
        await updateArticle(currentArticleId, {
          title: 'Untitled Article', // 暂时使用默认标题，后续可以让用户设置
          content: value
        })
        toast({
          title: "保存成功",
          description: "内容已保存",
          duration: 3000
        })
      } else {
        // 创建新文章
        const newArticle = await createArticle({
          title: 'Untitled Article', // 暂时使用默认标题，后续可以让用户设置
          content: value
        })
        setCurrentArticleId(newArticle.id)
        // 重新加载文章列表
        await loadArticles()
        toast({
          title: "保存成功",
          description: "文章已创建并保存",
          duration: 3000
        })
      }
      setIsDraft(false)
    } catch (error) {
      console.error('保存失败:', error)
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "无法保存内容，请检查网络连接",
        action: <ToastAction altText="重试" onClick={handleSave}>重试</ToastAction>,
      })
    } finally {
      setIsLoading(false)
    }
  }, [value, toast, isLoggedIn, currentArticleId])

  const { isConverting, previewContent } = usePreviewContent({
    value,
    selectedTemplate,
    styleOptions,
    codeTheme
  })

  const { handleKeyDown } = useEditorKeyboard({
    value,
    onChange: (newValue) => {
      setValue(newValue)
      handleEditorChange(newValue)
    },
    onSave: handleSave
  })

  // 处理编辑器输入
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const currentPosition = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
      scrollTop: e.target.scrollTop
    }
    
    setValue(newValue)
    handleEditorChange(newValue)
    
    // 使用 requestAnimationFrame 确保在下一帧恢复滚动位置和光标位置
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = currentPosition.scrollTop
        textareaRef.current.setSelectionRange(currentPosition.start, currentPosition.end)
      }
    })
  }, [handleEditorChange])

  const { copyToClipboard } = useCopy()

  const handleCopy = useCallback(async (): Promise<boolean> => {
    const contentElement = previewRef.current?.querySelector('.preview-content') as HTMLElement | null
    if (!contentElement) return false

    const success = await copyToClipboard(contentElement)
    if (success) {
      toast({
        title: "复制成功",
        description: "内容已复制，可直接粘贴到公众号编辑器",
        duration: 2000
      })
    } else {
      toast({
        variant: "destructive",
        title: "复制失败",
        description: "无法访问剪贴板，请检查浏览器权限",
        duration: 2000
      })
    }
    return success
  }, [copyToClipboard, toast, previewRef])

  // 加载用户的文章列表
  const loadArticles = useCallback(async () => {
    if (!isLoggedIn) return

    try {
      setIsLoadingArticles(true)
      const articlesList = await getArticles()
      setArticles(articlesList)
    } catch (error) {
      console.error('加载文章列表失败:', error)
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "无法加载文章列表，请检查网络连接",
        duration: 3000
      })
    } finally {
      setIsLoadingArticles(false)
    }
  }, [isLoggedIn, toast])

  // 处理放弃草稿
  const handleDiscardDraft = useCallback(async () => {
    if (currentArticleId) {
      try {
        // 重新加载当前文章
        const article = await getArticle(currentArticleId)
        setValue(article.content)
        setIsDraft(false)
        toast({
          title: "已放弃草稿",
          description: "已恢复到上次保存的内容",
          duration: 2000
        })
      } catch (error) {
        console.error('放弃草稿失败:', error)
        toast({
          variant: "destructive",
          title: "操作失败",
          description: "无法放弃草稿，请检查网络连接",
          duration: 3000
        })
      }
    } else {
      // 如果没有当前文章，清空内容
      setValue('')
      setIsDraft(false)
      toast({
        title: "已放弃草稿",
        description: "已清空编辑器内容",
        duration: 2000
      })
    }
  }, [toast, currentArticleId])

  // 处理文章选择
  const handleArticleSelect = useCallback(async (article: Article) => {
    try {
      setIsLoading(true)
      // 直接使用传入的文章数据，因为已经是从后端获取的完整数据
      setValue(article.content)
      setCurrentArticleId(article.id)
      setSelectedTemplate('default') // 暂时使用默认模板，后续可以在文章中存储模板信息
      setIsDraft(false)
      toast({
        title: "加载成功",
        description: `已加载文章: ${article.title}`,
        duration: 2000
      })
    } catch (error) {
      console.error('加载文章失败:', error)
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "无法加载选中的文章，请检查网络连接",
        duration: 3000
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // 处理新建文章
  const handleNewArticle = useCallback(() => {
    if (isDraft) {
      toast({
        title: "提示",
        description: "当前文章未保存，是否继续？",
        action: (
          <ToastAction altText="继续" onClick={() => {
            const exampleContent = getExampleContent()
            setValue(exampleContent)
            setCurrentArticleId(null)
            setIsDraft(false)
          }}>
            继续
          </ToastAction>
        ),
        duration: 5000,
      })
      return
    }

    const exampleContent = getExampleContent()
    setValue(exampleContent)
    setCurrentArticleId(null)
    setIsDraft(false)
  }, [isDraft, toast])

  // 处理工具栏插入文本
  const handleToolbarInsert = useCallback((text: string, options?: { wrap?: boolean; placeholder?: string; suffix?: string }) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const scrollTop = textarea.scrollTop
    
    let newText = ''
    let newCursorPos = 0

    if (options?.wrap && selectedText) {
      newText = value.substring(0, start) + 
                text + selectedText + (options.suffix || text) + 
                value.substring(end)
      newCursorPos = start + text.length + selectedText.length + (options.suffix?.length || text.length)
    } else {
      const insertText = selectedText || options?.placeholder || ''
      newText = value.substring(0, start) + 
                text + insertText + (options?.suffix || '') + 
                value.substring(end)
      newCursorPos = start + text.length + insertText.length + (options?.suffix?.length || 0)
    }

    setValue(newText)
    handleEditorChange(newText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.scrollTop = scrollTop
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    })
  }, [value, handleEditorChange])

  // 处理模版选择
  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplate(templateId)
    setStyleOptions({})
  }, [])

  // 检测是否为移动设备
  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 640
  }, [])

  // 自动切换预览模式
  useEffect(() => {
    const handleResize = () => {
      if (isMobile()) {
        setPreviewSize('full')
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMobile])

  // 加载已保存的内容
  useEffect(() => {
    if (isLoggedIn) {
      // 登录状态下，加载文章列表
      loadArticles()
    } else {
      // 未登录状态下，加载示例内容
      const exampleContent = getExampleContent()
      setValue(exampleContent)
      toast({
        title: "欢迎使用 easyarticle",
        description: "请登录以保存和管理您的文章",
        duration: 3000,
      })
    }
  }, [isLoggedIn, loadArticles, toast])

  const { wordCount, readingTime } = useWordStats(value)

  return (
    <div className="relative flex flex-col h-screen">
      {/* 工具栏 */}
      <EditorToolbar
        value={value}
        isDraft={isDraft}
        showPreview={showPreview}
        selectedTemplate={selectedTemplate}
        styleOptions={styleOptions}
        codeTheme={codeTheme}
        wordCount={wordCount}
        readingTime={readingTime}
        articles={articles}
        isLoadingArticles={isLoadingArticles}
        onSave={handleSave}
        onCopy={handleCopy}
        onCopyPreview={handleCopy}
        onNewArticle={handleNewArticle}
        onArticleSelect={handleArticleSelect}
        onTemplateSelect={(templateId: string) => setSelectedTemplate(templateId)}
        onTemplateChange={() => {}}
        onStyleOptionsChange={setStyleOptions}
        onPreviewToggle={() => setShowPreview(!showPreview)}
        onCodeThemeChange={setCodeTheme}
        onClear={handleClear}
      />

      {/* 编辑器主体 */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* 移动设备编辑器 */}
        <MobileEditor
          textareaRef={textareaRef}
          previewRef={previewRef}
          value={value}
          selectedTemplate={selectedTemplate}
          previewSize={previewSize}
          codeTheme={codeTheme}
          previewContent={previewContent}
          isConverting={isConverting}
          onValueChange={setValue}
          onEditorChange={handleEditorChange}
          onEditorScroll={handleEditorScroll}
          onPreviewSizeChange={setPreviewSize}
          onCopy={handleCopy}
        />

        {/* 桌面设备编辑器 */}
        <DesktopEditor
          editorRef={editorRef}
          textareaRef={textareaRef}
          previewRef={previewRef}
          value={value}
          selectedTemplate={selectedTemplate}
          showPreview={showPreview}
          previewSize={previewSize}
          isConverting={isConverting}
          previewContent={previewContent}
          codeTheme={codeTheme}
          onValueChange={setValue}
          onEditorChange={handleEditorChange}
          onEditorScroll={handleEditorScroll}
          onPreviewSizeChange={setPreviewSize}
          onToolbarInsert={handleToolbarInsert}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* 底部状态栏 */}
      <div className="h-10 bg-background border-t flex items-center justify-end px-4 gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{wordCount} 字</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
          <span>约 {readingTime}</span>
        </div>
      </div>
    </div>
  )
}