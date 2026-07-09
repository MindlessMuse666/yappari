type AlertParams = {
  title?: string
  message: string
  buttonText?: string
}

type ConfirmParams = {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
}

let alertInstance: {
  show: (params: AlertParams) => Promise<void>
  confirm: (params: ConfirmParams) => Promise<boolean>
} | null = null

export const useAlert = () => {
  const registerAlert = (instance: any) => {
    alertInstance = instance
  }

  const alert = (params: AlertParams): Promise<void> => {
    if (alertInstance) {
      return alertInstance.show(params)
    }
    // Fallback
    window.alert(params.message)
    return Promise.resolve()
  }

  const confirm = (params: ConfirmParams): Promise<boolean> => {
    if (alertInstance) {
      return alertInstance.confirm(params)
    }
    // Fallback
    return Promise.resolve(window.confirm(params.message))
  }

  return { registerAlert, alert, confirm }
}
