import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

async function testFlow() {
  try {
    console.log('1. Registering Patient...');
    const patientRes = await api.post('/auth/register', {
      name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'patient',
      date_of_birth: '1990-01-01', gender: 'male', blood_group: 'O+'
    });
    console.log('Patient registered:', patientRes.data.user.id);
    const patientToken = patientRes.data.token;

    console.log('2. Registering Doctor...');
    const doctorRes = await api.post('/auth/register', {
      name: 'Dr. Smith', email: 'smith@example.com', password: 'password123', role: 'doctor',
      department_id: 1, specialization: 'Cardiology', experience_years: 10, consultation_fee: 500
    });
    console.log('Doctor registered:', doctorRes.data.user.id);
    const doctorToken = doctorRes.data.token;

    console.log('3. Patient booking appointment...');
    const bookRes = await api.post('/appointments', {
      doctor_id: doctorRes.data.user.profileId,
      department_id: 1,
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: '10:00:00',
      reason: 'Heart checkup'
    }, { headers: { Authorization: `Bearer ${patientToken}` } });
    console.log('Appointment booked with Queue #:', bookRes.data.queueNumber);

    console.log('4. Doctor fetching queue...');
    const queueRes = await api.get('/doctors/queue', { headers: { Authorization: `Bearer ${doctorToken}` } });
    console.log('Doctor Queue Length:', queueRes.data.length);
    
    console.log('Test successful!');
  } catch (err) {
    console.error('Test failed:', err.response ? err.response.data : err.message);
  }
}

testFlow();
