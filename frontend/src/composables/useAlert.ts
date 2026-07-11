/**
 * Композабл для кастомных диалоговых окон (alert/confirm).
 *
 * Предоставляет глобальный доступ к модальному окну CustomAlert
 * через синглтон-экземпляр. Позволяет вызывать alert/confirm
 * из любого компонента без передачи пропсов.
 *
 * @example
 * ```ts
 * const { alert, confirm } = useAlert()
 *
 * // Простое уведомление
 * await alert({ title: 'Ошибка', message: 'Что-то пошло не так' })
 *
 * // Подтверждение действия
 * const ok = await confirm({
 *   title: 'Удаление',
 *   message: 'Вы уверены?',
 *   confirmText: 'Удалить',
 *   cancelText: 'Отмена',
 * })
 * if (ok) { /* выполняем действие *\/ }
 * ```
 *
 * @module composables/useAlert
 */

import type { CustomAlertExposed } from '../types'

/** Параметры alert-окна */
export type AlertParams = {
  title?: string
  message: string
  buttonText?: string
  isError?: boolean
}

/** Параметры confirm-окна */
export type ConfirmParams = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

/** Синглтон-экземпляр компонента CustomAlert */
let alertInstance: {
  show: (params: AlertParams) => Promise<void>
  confirm: (params: ConfirmParams) => Promise<boolean>
} | null = null

/**
 * Возвращает методы для вызова alert/confirm.
 *
 * Перед использованием компонент CustomAlert должен
 * зарегистрироваться через `registerAlert`.
 */
export const useAlert = () => {
  /** Регистрирует экземпляр CustomAlert */
  const registerAlert = (instance: CustomAlertExposed) => {
    alertInstance = instance
  }

  /** Показывает alert-уведомление */
  const alert = (params: AlertParams): Promise<void> => {
    if (alertInstance) {
      return alertInstance.show(params)
    }
    window.alert(params.message)
    return Promise.resolve()
  }

  /** Показывает confirm-диалог */
  const confirm = (params: ConfirmParams): Promise<boolean> => {
    if (alertInstance) {
      return alertInstance.confirm(params)
    }
    return Promise.resolve(window.confirm(params.message))
  }

  return { registerAlert, alert, confirm }
}
