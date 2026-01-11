export { 
  useUsers, 
  useUser, 
  useAllUsersForAssignment,
  useCreateUser, 
  useUpdateUser, 
  useDeactivateUser,
  useBulkUpdateRole,
  useBulkDeactivate,
  type UseUsersOptions 
} from "./hooks/use-users-api";

export {
  useUserProfile,
  useUpdateProfile,
  useUserIdentities,
  useAllUserIdentities,
  useLinkIdentity,
  useUnlinkIdentity,
  useUpdateIdentity,
  useAvailableSystems,
  useMergeUsers,
} from "./hooks/use-identity-api";
