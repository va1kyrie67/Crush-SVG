import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { successResponse, errorResponse } from '@/lib/http/api-response'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

import { uploadImage } from '@/lib/integrations/cloudinary'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(request, 'admin:upload:image', 30, 60_000)
    if (!rl.allowed) {
        return errorResponse(429, 'rate_limit_exceeded', 'Too many requests.', rateLimitHeaders(rl), request)
    }

    const adminCheck = await requireAdmin(request)
    if ('error' in adminCheck) return adminCheck.error

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
        return errorResponse(400, 'no_file', 'No file provided', undefined, request)
    }

    if (!file.type.startsWith('image/')) {
        return errorResponse(400, 'invalid_type', 'File must be an image', undefined, request)
    }

    if (file.size > 5 * 1024 * 1024) {
        return errorResponse(400, 'file_too_large', 'Image must be less than 5MB', undefined, request)
    }

    try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 1. If Cloudinary is configured, upload to Cloudinary
        if (
            process.env.CLOUDINARY_CLOUD_NAME && 
            process.env.CLOUDINARY_CLOUD_NAME !== "dummy" &&
            process.env.CLOUDINARY_API_KEY && 
            process.env.CLOUDINARY_API_KEY !== "dummy"
        ) {
            try {
                const cloudResult: any = await uploadImage(buffer, "crushsvg/blog")
                if (cloudResult?.secure_url) {
                    return successResponse({ url: cloudResult.secure_url }, 200, rateLimitHeaders(rl), request)
                }
            } catch (cloudErr) {
                console.warn("Cloudinary upload failed, attempting local fallback:", cloudErr)
            }
        }

        // 2. Try writing to local public folder (works in standard Node.js server)
        try {
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'blog')
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true })
            }

            const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
            const filename = `blog-${uuidv4()}.${extension}`
            const filepath = join(uploadDir, filename)

            await writeFile(filepath, buffer)
            const url = `/uploads/blog/${filename}`
            return successResponse({ url }, 200, rateLimitHeaders(rl), request)
        } catch (fsErr) {
            // 3. Fallback for read-only serverless filesystems
            console.warn("Local filesystem write failed, using base64 fallback:", fsErr)
            const mimeType = file.type || 'image/png'
            const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`
            return successResponse({ url: dataUri }, 200, rateLimitHeaders(rl), request)
        }
    } catch (error) {
        console.error('Image upload failed:', error)
        return errorResponse(500, 'upload_failed', 'Failed to upload image', undefined, request)
    }
}