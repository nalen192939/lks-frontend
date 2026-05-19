import * as XLSX from 'xlsx-js-style'

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export const useExcelExport = () => {
  const downloadWorkbook = (workbook: XLSX.WorkBook, fileName: string) => {
    if (import.meta.server) {
      throw new Error('Export Excel hanya bisa dijalankan dari browser.')
    }

    const buffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: true
    })
    const blob = new Blob([buffer], { type: EXCEL_MIME_TYPE })

    const legacyNavigator = window.navigator as Navigator & {
      msSaveOrOpenBlob?: (blob: Blob, defaultName?: string) => boolean
    }

    if (legacyNavigator.msSaveOrOpenBlob) {
      legacyNavigator.msSaveOrOpenBlob(blob, fileName)
      return
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.rel = 'noopener'
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()
    link.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
  }

  return {
    downloadWorkbook
  }
}
