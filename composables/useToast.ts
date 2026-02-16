import { toastController } from '@ionic/vue'

export const useToast = () => {
  const success = async (message: string) => {
    const toast = await toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'success',
      cssClass: 'pp-toast',
    })
    await toast.present()
  }

  const error = async (message: string) => {
    const toast = await toastController.create({
      message,
      duration: 5000,
      position: 'top',
      color: 'danger',
      buttons: [{ text: 'OK', role: 'cancel' }],
      cssClass: 'pp-toast',
    })
    await toast.present()
  }

  const warning = async (message: string) => {
    const toast = await toastController.create({
      message,
      duration: 4000,
      position: 'top',
      color: 'warning',
      cssClass: 'pp-toast',
    })
    await toast.present()
  }

  const info = async (message: string) => {
    const toast = await toastController.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'medium',
      cssClass: 'pp-toast',
    })
    await toast.present()
  }

  return { success, error, warning, info }
}
