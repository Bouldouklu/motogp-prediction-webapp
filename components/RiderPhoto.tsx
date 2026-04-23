'use client'

interface RiderPhotoProps {
  src: string
  alt: string
  className?: string
}

export default function RiderPhoto({ src, alt, className }: RiderPhotoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}
