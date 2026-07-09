type AlertParams = {
  title?: string
  message: string
  buttonText?: string
}

// Use a global variable instead of ref to avoid reactivity issues
let alertInstance: {
  show: (params: AlertParams) => Promise<void>
} | null = null

export const useAlert = () => {
  const registerAlert = (instance: any) => {
    alertInstance = instance
  }

  const alert = (params: AlertParams): Promise<void> => {
    if (alertInstance) {
      return alertInstance.show(params)
    }
    // Fallback to native alert
    return Promise.resolve(window.alert(params.message))
  }

  return { registerAlert, alert }
}
