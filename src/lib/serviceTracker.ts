/** A maintenance task of the service tracker (GET/POST /vehicles/service-tasks), identified by `_id` or `id` */
export type ServiceTask = {
  _id?: string
  id?: string
  name: string
}

/** The id of a service task, whichever of `_id` and `id` it has */
export function serviceTaskKey(task: ServiceTask): string {
  return task._id || task.id || ''
}

/** Service status of one task for a vehicle (GET /vehicles/:id/service-status) */
export type ServiceStatusItem = {
  serviceTaskId: string
  serviceTaskName: string
  intervalKm: number | null
  intervalMonths: number | null
  lastServiceDate: string | null
  lastServiceOdometer: number | null
  nextServiceDate: string | null
  nextServiceOdometer: number | null
  remainingKm: number | null
  remainingDays: number | null
  status: 'OK' | 'WARNING' | 'OVERDUE'
}

/** Interval inputs of one task in the service plans editor, as entered in the text fields */
export type IntervalInputs = {
  intervalKm: string
  intervalMonths: string
}
