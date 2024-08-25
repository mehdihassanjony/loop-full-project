export interface IVendor {
  id: number;
  userId: string;
  fullName: string;
  phone: string;
  profilePicture: string;
  email: string;
  companyName: string;
  subsType: string;
  monthlyFeed: number;
  makePayout: 'wednesday' | 'monday';
}
