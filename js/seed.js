const SEED = {
  users: [
    { id: 1, name: 'Admin User', email: 'admin@campus.com', password: 'Admin123', role: 'admin' },
    { id: 2, name: 'Tech Rahim', email: 'tech@campus.com', password: 'Tech1234', role: 'technician' },
    { id: 3, name: 'Student Ayesha', email: 'student@campus.com', password: 'Student1', role: 'student' }
  ],
  buildings: [
    { id: 1, name: 'Academic Building 1' },
    { id: 2, name: 'Library' },
    { id: 3, name: 'Hostel A' },
    { id: 4, name: 'Computer Lab Building' }
  ],
  categories: [
    { id: 1, name: 'Plumbing' },
    { id: 2, name: 'Electrical' },
    { id: 3, name: 'Facilities' },
    { id: 4, name: 'Network and IT' },
    { id: 5, name: 'Safety' }
  ],
  issues: [
    {
      id: 1, title: 'Water leak in washroom', category: 'Plumbing', building: 'Hostel A',
      room: 'Floor 2 Washroom', priority: 'High', status: 'Open',
      description: 'Pipe is leaking near the sink.', photo: '',
      reporterId: 3, assignedTo: null, createdAt: '2026-10-10'
    },
    {
      id: 2, title: 'Exposed wire in lab', category: 'Safety', building: 'Computer Lab Building',
      room: 'Lab 3', priority: 'Critical', status: 'In Progress',
      description: 'Wire is hanging from the wall socket.', photo: '',
      reporterId: 3, assignedTo: 2, createdAt: '2026-10-12'
    }
  ],
  updates: [
    { id: 1, issueId: 1, text: 'Issue reported', status: 'Open', date: '2026-10-10' },
    { id: 2, issueId: 2, text: 'Issue reported', status: 'Open', date: '2026-10-12' },
    { id: 3, issueId: 2, text: 'Technician started work', status: 'In Progress', date: '2026-10-13' }
  ]
};