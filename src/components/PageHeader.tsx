import PageBack from './PageBack'

interface PageHeaderProps {
  section: string
  title: string
  description?: string
  backTo?: string
  compact?: boolean
}

export default function PageHeader({ section, title, description, backTo = '/', compact = false }: PageHeaderProps) {
  return (
    <div className="flex items-start gap-2.5">
      <PageBack to={backTo} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="section-title">{section}</p>
        <h1 className={compact ? 'mt-0.5 truncate text-xl font-bold tracking-tight text-white' : 'page-title mt-1'}>
          {title}
        </h1>
        {!compact && description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>}
      </div>
    </div>
  )
}
