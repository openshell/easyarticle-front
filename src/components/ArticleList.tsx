'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Trash2, Menu, Plus, Save, Edit2, Check } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { Input } from '@/components/ui/input'

interface Article {
  id: number
  userId: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

interface ArticleListProps {
  onSelect: (article: Article) => void
  currentContent?: string
  onNew?: () => void
  articles: Article[]
  isLoading: boolean
}

export function ArticleList({ onSelect, currentContent, onNew, articles, isLoading }: ArticleListProps) {
  const { toast } = useToast()
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // 保存当前文章
  const saveCurrentArticle = () => {
    // 保存当前文章的逻辑现在由父组件处理
    // 这里可以添加提示信息
    toast({
      title: "提示",
      description: "请使用编辑器中的保存按钮保存当前文章",
      duration: 2000
    })
  }

  // 删除文章
  const deleteArticle = (article: Article) => {
    // 暂时只显示提示信息，因为删除操作需要调用后端API
    toast({
      variant: "destructive",
      title: "操作提示",
      description: "删除文章功能暂未实现，请稍后再试",
      duration: 3000
    })
  }

  // 确认删除文章
  const confirmDelete = () => {
    // 暂时不需要实现，因为删除操作需要调用后端API
    setArticleToDelete(null)
  }

  // 新建文章
  const createNewArticle = () => {
    // 如果有外部传入的新建处理函数，优先使用
    if (onNew) {
      onNew()
      setIsOpen(false)
      return
    }

    // 默认的新建文章处理
    const newArticle: Article = {
      id: Date.now().toString(),
      title: '新文章',
      content: `# 新文章

## 简介
在这里写文章的简介...

## 正文
开始写作你的精彩内容...

## 总结
在这里总结文章的主要观点...

---
> 作者：[你的名字]
> 日期：${new Date().toLocaleDateString()}
`,
      template: 'default',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // 保存新文章到本地存储
    const updatedArticles = [newArticle, ...articles]
    setArticles(updatedArticles)
    localStorage.setItem('wechat_articles', JSON.stringify(updatedArticles))

    // 选中新文章并关闭列表
    onSelect(newArticle)
    setIsOpen(false)
    
    toast({
      title: "新建成功",
      description: "已创建新文章，开始写作吧！",
      duration: 2000
    })
  }

  // 开始重命名
  const startRename = (article: Article) => {
    // 暂时只显示提示信息，因为重命名操作需要调用后端API
    toast({
      title: "操作提示",
      description: "重命名文章功能暂未实现，请稍后再试",
      duration: 3000
    })
  }

  // 保存重命名
  const saveRename = (article: Article) => {
    // 暂时不需要实现，因为重命名操作需要调用后端API
    setEditingId(null)
    setEditingTitle('')
  }

  // 取消重命名
  const cancelRename = () => {
    setEditingId(null)
    setEditingTitle('')
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Menu className="h-5 w-5" />
            <span className="sr-only">文章列表</span>
            {articles.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] text-primary-foreground rounded-full flex items-center justify-center">
                {articles.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>文章列表</SheetTitle>
            <SheetDescription className="flex gap-2">
              <Button onClick={createNewArticle} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                新建文章
              </Button>
              <Button onClick={saveCurrentArticle} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                保存当前
              </Button>
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  加载中...
                </div>
              ) : articles.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  暂无保存的文章
                </div>
              ) : (
                articles.map(article => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted group"
                  >
                    <button
                      onClick={() => onSelect(article)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{article.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(article.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => startRename(article)}
                      >
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">重命名</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => deleteArticle(article)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">删除</span>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!articleToDelete} onOpenChange={() => setArticleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除文章"{articleToDelete?.title}"吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 