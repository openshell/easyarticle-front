import { useCallback, useEffect, useRef } from 'react'
import { AUTO_SAVE_DELAY } from '../constants'
import { updateArticle, createArticle } from '@/lib/api'

export function useAutoSave(value: string, setIsDraft: (isDraft: boolean) => void, currentArticleId: number | null) {
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()

  const handleEditorChange = useCallback(async (v: string) => {
    setIsDraft(true)
    
    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    
    // 设置新的自动保存定时器
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        if (currentArticleId) {
          // 更新现有文章
          await updateArticle(currentArticleId, {
            title: 'Untitled Article', // 暂时使用默认标题，后续可以让用户设置
            content: v
          })
        } else {
          // 创建新文章
          await createArticle({
            title: 'Untitled Article', // 暂时使用默认标题，后续可以让用户设置
            content: v
          })
        }
        setIsDraft(false)
      } catch (error) {
        console.error('自动保存失败:', error)
        // 保存失败时，仍然设置为非草稿状态，避免一直显示保存中
        setIsDraft(false)
      }
    }, AUTO_SAVE_DELAY)
  }, [setIsDraft, currentArticleId])

  // 清理自动保存定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  return { handleEditorChange }
} 