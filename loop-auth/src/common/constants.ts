// NOTE: Class used instead of Enum as we need a group of string constants
export class ModuleName {
  public static readonly AUTH = 'auth';
  public static readonly REDIS = 'redis';
}

// NOTE: Class used instead of Enum as we need a group of string constants
export class UserRole {
  public static readonly ADMIN = 'admin';
  public static readonly GM = 'gm';
  public static readonly CLUSTER_HEAD = 'cluster_head';
  public static readonly KAM = 'kam';
  public static readonly PRO = 'pro';
  public static readonly FINANCE = 'finance';
  public static readonly SHIPPER = 'shipper';
  public static readonly SHIPER_AGENT = 'shipper_agent';
  public static readonly VENDOR = 'vendor';
}

export const SIGNUP_USER_ROLE = [UserRole.SHIPPER, UserRole.VENDOR];

// ============= DONT CHANGE NAME, CONNECTION TO ENTITY ============== //
// ==================== ORDERING IS IMPORTANT ======================== //
export const USERROLE = [
  UserRole.ADMIN,
  UserRole.GM,
  UserRole.CLUSTER_HEAD,
  UserRole.KAM,
  UserRole.FINANCE,
  UserRole.SHIPPER,
  UserRole.SHIPER_AGENT,
  UserRole.VENDOR,
  UserRole.PRO,
];

export const HIERARCHY_USER_ROLE = [
  UserRole.GM,
  UserRole.CLUSTER_HEAD,
  UserRole.KAM,
];

// ========= AUTH GUARD PERMISSION COMMON ROLES ARRAY =========== //
export const SHIPPER_VENDOR = [UserRole.SHIPPER, UserRole.VENDOR];

export const CRM = [
  UserRole.ADMIN,
  UserRole.GM,
  UserRole.CLUSTER_HEAD,
  UserRole.KAM,
  UserRole.PRO,
];

export const CRM_SHIPPER = [...CRM, UserRole.SHIPPER];
