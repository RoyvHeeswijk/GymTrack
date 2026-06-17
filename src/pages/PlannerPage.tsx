import { useSchedule } from '../hooks/useSchedule'
import SchemaGenerator from '../components/SchemaGenerator'
import SchemaStoragePanel from '../components/SchemaStoragePanel'
import PageHeader from '../components/PageHeader'

export default function PlannerPage() {
  const { reload } = useSchedule()

  return (
    <div className="app-page app-page-planner">
      <PageHeader
        section="Schema"
        title="Trainingsschema"
        compact
      />

      <SchemaStoragePanel onChanged={reload} />

      <div className="card">
        <SchemaGenerator onActivated={reload} />
      </div>
    </div>
  )
}
