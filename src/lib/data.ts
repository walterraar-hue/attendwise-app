import { Company, User, AttendanceRecord } from './types';
import { PlaceHolderImages } from './placeholder-images';

export const company: Company = {
  id: 'ATTEND-WISE-DEMO',
  name: 'AttendWise Demo Inc.',
  subscription: {
    plan: 'Pro',
    userLimit: 10,
    recordLimit: 1000,
    usedSlots: 6,
  },
  policies: "Employees are expected to check in by 9:05 AM. Consistent tardiness of more than 3 times a month will be flagged. Unannounced absences require immediate notification to the manager.",
};

const avatarMap = PlaceHolderImages.reduce((acc, img) => {
    acc[img.id] = img.imageUrl;
    return acc;
}, {} as Record<string, string>);


export const users: User[] = [
  { id: 'usr-admin-01', name: 'Alex Johnson', email: 'alex.j@example.com', role: 'Global Admin', status: 'active', avatarUrl: avatarMap['avatar1'] },
  { id: 'usr-manager-01', name: 'Samantha Carter', email: 'sam.c@example.com', role: 'Manager', status: 'active', avatarUrl: avatarMap['avatar2'], teamId: 'team-alpha' },
  { id: 'usr-emp-01', name: 'Michael Chen', email: 'michael.c@example.com', role: 'Employee', status: 'active', avatarUrl: avatarMap['avatar3'], teamId: 'team-alpha' },
  { id: 'usr-emp-02', name: 'Jessica Rodriguez', email: 'jessica.r@example.com', role: 'Employee', status: 'active', avatarUrl: avatarMap['avatar4'], teamId: 'team-alpha' },
  { id: 'usr-emp-03', name: 'David Lee', email: 'david.l@example.com', role: 'Employee', status: 'pending', avatarUrl: avatarMap['avatar5'], teamId: 'team-bravo' },
  { id: 'usr-manager-02', name: 'Daniel Jackson', email: 'daniel.j@example.com', role: 'Manager', status: 'active', avatarUrl: avatarMap['avatar6'], teamId: 'team-bravo' },
];

export const attendance: AttendanceRecord[] = [
  // Team Alpha - Sam's Team
  { id: 'att-01', userId: 'usr-manager-01', userName: 'Samantha Carter', date: '2024-07-22', checkIn: '08:55', checkOut: '17:30', status: 'Present' },
  { id: 'att-02', userId: 'usr-emp-01', userName: 'Michael Chen', date: '2024-07-22', checkIn: '09:15', checkOut: '17:45', status: 'Late' },
  { id: 'att-03', userId: 'usr-emp-02', userName: 'Jessica Rodriguez', date: '2024-07-22', checkIn: '08:58', checkOut: '17:32', status: 'Present' },
  { id: 'att-04', userId: 'usr-manager-01', userName: 'Samantha Carter', date: '2024-07-23', checkIn: '09:00', checkOut: '17:35', status: 'Present' },
  { id: 'att-05', userId: 'usr-emp-01', userName: 'Michael Chen', date: '2024-07-23', checkIn: '09:25', checkOut: '18:00', status: 'Late' },
  { id: 'att-06', userId: 'usr-emp-02', userName: 'Jessica Rodriguez', date: '2024-07-23', checkIn: null, checkOut: null, status: 'Absent' },
  { id: 'att-07', userId: 'usr-emp-01', userName: 'Michael Chen', date: '2024-07-24', checkIn: '09:10', checkOut: '17:50', status: 'Late' },

  // Team Bravo - Daniel's Team
  { id: 'att-08', userId: 'usr-manager-02', userName: 'Daniel Jackson', date: '2024-07-22', checkIn: '08:45', checkOut: '17:20', status: 'Present' },
  { id: 'att-09', userId: 'usr-emp-03', userName: 'David Lee', date: '2024-07-22', checkIn: '09:00', checkOut: '17:30', status: 'Present' },
  { id: 'att-10', userId: 'usr-manager-02', userName: 'Daniel Jackson', date: '2024-07-23', checkIn: '08:50', checkOut: '17:25', status: 'Present' },
  { id: 'att-11', userId: 'usr-emp-03', userName: 'David Lee', date: '2024-07-23', checkIn: '09:02', checkOut: '17:33', status: 'Present' },
];
