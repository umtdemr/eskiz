import { Service } from '@/core/services/Service'
import { API_ENDPOINTS } from '@/helpers/Constant'
import { useBoundStore } from '@/store/store'
import toast from 'react-hot-toast'
import { Image as ImageWidget, ImageResponse } from '@/core/shapes/image/Image'
import { WidgetsService } from '@/core/services/WidgetsService'
import { nanoid } from 'nanoid'
import { AddWidgetPayload } from '@/types/Websocket'
import { CreationHistoryEntry } from '@/core/history/HistoryManager'

export class ImageUploadService extends Service {
    private readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    private readonly MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB
    private readonly MAX_DIMENSION = 7096 // 7k roughly
    private readonly ALLOWED_TYPES = [
        'image/jpeg',
        'image/png',
        'image/svg+xml',
    ]

    private async handleFiles(files: File[], boardId: number) {
        const errorCounts = this.getInitialErrorCounts()

        // validate files
        const { validFiles, hasTotalSizeError } = this.validateFiles(
            files,
            errorCounts,
        )

        if (
            hasTotalSizeError ||
            (validFiles.length === 0 && this.hasErrors(errorCounts))
        ) {
            this.showErrors(errorCounts)
            return
        }

        // check resolutions
        const finalFiles = await this.filterByResolution(
            validFiles,
            errorCounts,
        )

        if (finalFiles.length === 0) {
            this.showErrors(errorCounts)
            return
        }

        // create image widgets (local only for now)
        const fileWidgetMap = this.createWidgetsInLayout(finalFiles)
        if (!fileWidgetMap) return

        // upload images
        await this.uploadImages(fileWidgetMap, boardId, errorCounts)

        this.showErrors(errorCounts)
    }

    private getInitialErrorCounts() {
        return {
            unsupported_type: 0,
            too_large: 0,
            total_size_exceeded: 0,
            resolution_too_high: 0,
            upload_failed: 0,
        }
    }

    private hasErrors(counts: Record<string, number>): boolean {
        return Object.values(counts).some((count) => count > 0)
    }

    private validateFiles(files: File[], errorCounts: Record<string, number>) {
        const validFiles: File[] = []
        let totalSize = 0
        let hasTotalSizeError = false

        for (const file of files) {
            if (!this.ALLOWED_TYPES.includes(file.type)) {
                errorCounts['unsupported_type']++
                continue
            }

            if (file.size > this.MAX_FILE_SIZE) {
                errorCounts['too_large']++
                continue
            }

            totalSize += file.size
            if (totalSize > this.MAX_TOTAL_SIZE) {
                errorCounts['total_size_exceeded']++
                hasTotalSizeError = true
                break
            }

            validFiles.push(file)
        }

        return { validFiles, hasTotalSizeError }
    }

    private async filterByResolution(
        files: File[],
        errorCounts: Record<string, number>,
    ): Promise<{ file: File; width: number; height: number }[]> {
        const finalFiles: { file: File; width: number; height: number }[] = []

        await Promise.all(
            files.map(async (file) => {
                try {
                    const res = await this.checkResolution(file)
                    if (res.valid) {
                        finalFiles.push({
                            file,
                            width: res.width,
                            height: res.height,
                        })
                    } else {
                        errorCounts['resolution_too_high']++
                    }
                } catch (e) {
                    console.error('Error checking resolution', e)
                    errorCounts['resolution_too_high']++
                }
            }),
        )

        return finalFiles
    }

    private checkResolution(
        file: File,
    ): Promise<{ valid: boolean; width: number; height: number }> {
        return new Promise((resolve) => {
            const img = new Image()
            const objectUrl = URL.createObjectURL(file)
            img.onload = () => {
                const valid =
                    img.width <= this.MAX_DIMENSION &&
                    img.height <= this.MAX_DIMENSION
                URL.revokeObjectURL(objectUrl)
                resolve({ valid, width: img.width, height: img.height })
            }
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl)
                resolve({ valid: false, width: 0, height: 0 })
            }
            img.src = objectUrl
        })
    }

    private createWidgetsInLayout(
        files: { file: File; width: number; height: number }[],
    ): Map<File, ImageWidget> | null {
        const widgetLayer = this.engine.stage.widgetsDefaultLayer
        if (!widgetLayer || !files.length) return null

        const GAP = 50
        const MAX_COLS = 10

        const canvas = this.engine.canvas
        const scale = canvas.zoom
        const viewportCenterX =
            -canvas.translateX + canvas.canvasEl.width / scale / 2
        const viewportCenterY =
            -canvas.translateY + canvas.canvasEl.height / scale / 2

        let currentX = 0
        let currentY = 0
        let rowHeight = 0
        const widgetsPlacement: {
            x: number
            y: number
            width: number
            height: number
            file: File
        }[] = []

        files.forEach((item, index) => {
            // new row every MAX_COLS
            if (index > 0 && index % MAX_COLS === 0) {
                currentX = 0
                currentY += rowHeight + GAP
                rowHeight = 0
            }

            widgetsPlacement.push({
                x: currentX,
                y: currentY,
                width: item.width,
                height: item.height,
                file: item.file,
            })

            currentX += item.width + GAP
            rowHeight = Math.max(rowHeight, item.height)
        })

        // center the whole block
        let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity
        widgetsPlacement.forEach((p) => {
            minX = Math.min(minX, p.x)
            maxX = Math.max(maxX, p.x + p.width)
            minY = Math.min(minY, p.y)
            maxY = Math.max(maxY, p.y + p.height)
        })

        const blockWidth = maxX - minX
        const blockHeight = maxY - minY

        const startX = viewportCenterX - blockWidth / 2
        const startY = viewportCenterY - blockHeight / 2

        const fileWidgetMap = new Map<File, ImageWidget>()

        // add widgets to canvas
        widgetsPlacement.forEach((p) => {
            const localUrl = URL.createObjectURL(p.file)

            const widget = new ImageWidget(
                {
                    x: startX + p.x,
                    y: startY + p.y,
                    width: p.width,
                    height: p.height,
                    uuid: nanoid(),
                    properties: {
                        localUrl: localUrl,
                    },
                },
                this.engine,
            )

            // set mime type for proper
            widget.setMimeType(p.file.type)

            fileWidgetMap.set(p.file, widget)
            this.engine.stage.addWidget(widget)
        })

        this.engine.canvas.requestRender()
        return fileWidgetMap
    }

    private async uploadImages(
        fileWidgetMap: Map<File, ImageWidget>,
        boardId: number,
        errorCounts: Record<string, number>,
    ) {
        const promises: Promise<void>[] = []
        const widgetsService = this.engine.getService<WidgetsService>('widgets')
        const addedImages: ImageWidget[] = []

        fileWidgetMap.forEach((widget, file) => {
            promises.push(
                (async () => {
                    try {
                        const result = await this.uploadFile(file, boardId)
                        // on success, update widget to use remote url
                        widget.onUploadSuccess(result)

                        // add to db
                        // TODO: phase 2 - check error
                        // TODO: bulk add?
                        widgetsService.addWidget({
                            ...(widget.toJson() as AddWidgetPayload),
                            page_id: this.engine.pageId,
                        })

                        addedImages.push(widget)
                    } catch (e: unknown) {
                        console.error('Upload failed', e)
                        errorCounts['upload_failed']++
                        // on fail, remove widget
                        // TODO: remove
                        if (widgetsService) {
                            widgetsService.deleteWidget(widget)
                        } else {
                            widget.delete()
                        }
                    }
                })(),
            )
        })

        // add to history
        this.engine.historyManager.push(
            new CreationHistoryEntry(this.engine, addedImages),
        )

        await Promise.all(promises)
    }

    private showErrors(counts: Record<string, number>) {
        if (counts['total_size_exceeded'] > 0) {
            toast.error(`Total size limit exceeded`, { duration: 5000 })
            return
        }
        if (counts['unsupported_type'] > 0) {
            toast.error(`Unsupported file type`, { duration: 5000 })
            return
        }
        if (counts['too_large'] > 0) {
            toast.error(`File too large`, { duration: 5000 })
            return
        }
        if (counts['resolution_too_high'] > 0) {
            toast.error(`Resolution too high`, { duration: 5000 })
            return
        }
        if (counts['upload_failed'] > 0) {
            toast.error(`Upload failed`, { duration: 5000 })
            return
        }
    }

    private async uploadFile(
        file: File,
        boardId: number,
    ): Promise<ImageResponse> {
        const formData = new FormData()
        formData.append('board_id', boardId.toString())
        formData.append('image', file)

        const token = useBoundStore.getState().token

        const response = await fetch(API_ENDPOINTS.IMAGE_UPLOAD, {
            method: 'POST',
            body: formData,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!response.ok) {
            let errMsg = 'Server error'
            try {
                const errData = await response.json()
                errMsg = errData.error || errMsg
            } catch {
                // ignore JSON parse errors
            }
            throw new Error(errMsg)
        }

        const data = await response.json()
        return data as ImageResponse
    }

    pickAndUpload() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = this.ALLOWED_TYPES.join(',')
        input.multiple = true
        input.style.display = 'none'

        input.onchange = async (e) => {
            const tempFiles = (e.target as HTMLInputElement).files
            if (!tempFiles || tempFiles.length === 0) return

            const files = Array.from(tempFiles)
            await this.handleFiles(files, this.engine.boardId)
            input.remove()
        }

        document.body.appendChild(input)
        input.click()
    }
}
