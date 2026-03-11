export const dashboardStats = [
  {
    label: "Total Students",
    value: "248",
    change: "+12 this month",
  },
  {
    label: "Occupied Seats",
    value: "182",
    change: "73% occupancy",
  },
  {
    label: "Empty Seats",
    value: "68",
    change: "Available now",
  },
  {
    label: "Today's Attendance",
    value: "221",
    change: "89% present",
  },
];

export const students = [
  {
    id: "ST-101",
    name: "Aarav Sharma",
    seatNumber: "A-12",
    phone: "+91 98765 20110",
    joinDate: "2025-11-12",
    paymentStatus: "Paid",
    address: "Sector 14, Noida",
    documents: ["Aadhaar Card", "College ID"],
  },
  {
    id: "ST-102",
    name: "Riya Mehta",
    seatNumber: "B-03",
    phone: "+91 98110 00443",
    joinDate: "2025-12-08",
    paymentStatus: "Pending",
    address: "Raj Nagar, Ghaziabad",
    documents: ["Passport Photo", "PAN Card"],
  },
  {
    id: "ST-103",
    name: "Karan Sethi",
    seatNumber: "C-09",
    phone: "+91 98991 33210",
    joinDate: "2026-01-06",
    paymentStatus: "Paid",
    address: "Patel Nagar, Delhi",
    documents: ["Driving License"],
  },
  {
    id: "ST-104",
    name: "Sneha Kapoor",
    seatNumber: "D-01",
    phone: "+91 99587 11903",
    joinDate: "2026-02-02",
    paymentStatus: "Overdue",
    address: "Model Town, Delhi",
    documents: ["Aadhaar Card", "Address Proof"],
  },
];

export const seats = Array.from({ length: 20 }, (_, index) => {
  const seatNumber = index + 1;
  const occupied = [1, 3, 4, 6, 8, 9, 10, 13, 15, 18].includes(seatNumber);

  return {
    id: seatNumber,
    label: `Seat ${seatNumber}`,
    status: occupied ? "Occupied" : "Empty",
    student: occupied ? students[seatNumber % students.length].name : null,
  };
});

export const attendance = [
  {
    id: 1,
    student: "Aarav Sharma",
    seat: "A-12",
    checkIn: "08:00 AM",
    checkOut: "02:30 PM",
    date: "2026-03-11",
  },
  {
    id: 2,
    student: "Riya Mehta",
    seat: "B-03",
    checkIn: "09:10 AM",
    checkOut: "01:00 PM",
    date: "2026-03-11",
  },
  {
    id: 3,
    student: "Karan Sethi",
    seat: "C-09",
    checkIn: "07:45 AM",
    checkOut: "12:40 PM",
    date: "2026-03-11",
  },
];

export const payments = [
  {
    id: 1,
    student: "Aarav Sharma",
    seat: "A-12",
    month: "March 2026",
    amount: "Rs 2,500",
    status: "Paid",
  },
  {
    id: 2,
    student: "Riya Mehta",
    seat: "B-03",
    month: "March 2026",
    amount: "Rs 2,500",
    status: "Pending",
  },
  {
    id: 3,
    student: "Sneha Kapoor",
    seat: "D-01",
    month: "March 2026",
    amount: "Rs 2,500",
    status: "Overdue",
  },
];

export const documents = [
  {
    id: 1,
    student: "Aarav Sharma",
    seat: "A-12",
    document: "Aadhaar Card",
    uploadedAt: "2026-02-14",
    status: "Verified",
  },
  {
    id: 2,
    student: "Riya Mehta",
    seat: "B-03",
    document: "PAN Card",
    uploadedAt: "2026-02-21",
    status: "Pending Review",
  },
  {
    id: 3,
    student: "Sneha Kapoor",
    seat: "D-01",
    document: "Address Proof",
    uploadedAt: "2026-03-01",
    status: "Verified",
  },
];

export const studentDashboard = {
  seatNumber: "A-12",
  paymentStatus: "Paid",
  uploadedDocuments: ["Aadhaar Card", "College ID", "Passport Photo"],
  attendanceHistory: [
    {
      date: "2026-03-11",
      checkIn: "08:00 AM",
      checkOut: "02:30 PM",
      hours: "6h 30m",
    },
    {
      date: "2026-03-10",
      checkIn: "08:20 AM",
      checkOut: "01:50 PM",
      hours: "5h 30m",
    },
    {
      date: "2026-03-09",
      checkIn: "07:55 AM",
      checkOut: "12:40 PM",
      hours: "4h 45m",
    },
  ],
};
