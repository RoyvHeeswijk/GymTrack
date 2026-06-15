import { useSchedule } from '../hooks/useSchedule'
import SchemaGenerator from '../components/SchemaGenerator'
import PageHeader from '../components/PageHeader'

export default function PlannerPage() {
  const { reload } = useSchedule()

  return (
    <div className="space-y-5">
      <PageHeader
        section="Schema"
        title="Maak je trainingsschema"
        description="Laat de AI een schema maken of vul zelf je bestaande schema in."
      />
      <div className="card">
        <SchemaGenerator onActivated={reload} />
      </div>
    </div>
  )
}
