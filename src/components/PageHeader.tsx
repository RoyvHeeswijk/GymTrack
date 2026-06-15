import PageBack from './PageBack'

interface PageHeaderProps {
  section: string
  title: string
  description?: string
  backTo?: string
}

export default function PageHeader({ section, title, description, backTo = '/' }: PageHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <PageBack to={backTo} />
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="section-title">{section}</p>
        <h1 className="page-title mt-1">{title}</h1>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>}
      </div>
    </div>
  )
}
