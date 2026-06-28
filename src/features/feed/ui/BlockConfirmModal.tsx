// UserActionModal moved to a shared location so non-feed screens (e.g. works
// review detail) can reuse it without importing feed UI. Kept as a re-export to
// avoid breaking existing feed imports.
export { UserActionModal } from '../../../components/common/UserActionModal'
