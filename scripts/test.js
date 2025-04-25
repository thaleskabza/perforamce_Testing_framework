import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// ← Replace these with your real Petfinder credentials:
const CLIENT_ID     = 'gbfuckDsPVmzzxskuQpgdeQ5tvZYX6NTa9vFszNJLkg8oTeQOK';
const CLIENT_SECRET = 'Y0E5cR6pNrzJinSZuvFlSVDws5NZINH4OdkJtK0d';

// Custom metrics
const animalValidationDuration = new Trend('animal_validation_duration');
const invalidAnimals           = new Rate('invalid_animals');
const photoValidationDuration  = new Trend('photo_validation_duration');

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 10 },
    { duration: '2m', target: 25 },
    { duration: '3m', target: 25 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed:   ['rate<0.1'],
    invalid_animals:   ['rate<0.1'],
  },
};

export function setup() {
  const payload = {
    grant_type:    'client_credentials',
    client_id:     CLIENT_ID,
    client_secret: CLIENT_SECRET,
  };
  const params = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
  const res = http.post('https://api.petfinder.com/v2/oauth2/token', payload, params);

  if (res.status !== 200) {
    throw new Error(`Token fetch failed: ${res.status} ${res.body}`);
  }
  return res.json('access_token');
}

function validateAnimal(animal) {
  const start = Date.now();
  let isValid = true;

  ['id','organization_id','type','species','breeds','age','gender','status','contact']
    .forEach(field => {
      if (!animal[field]) {
        console.warn(`Missing required field: ${field}`);
        isValid = false;
      }
    });

  if (animal.breeds && typeof animal.breeds.primary !== 'string') {
    console.warn('Invalid breeds.primary');
    isValid = false;
  }

  if (!['adoptable','adopted','found'].includes(animal.status)) {
    console.warn(`Invalid status: ${animal.status}`);
    isValid = false;
  }

  animalValidationDuration.add(Date.now() - start);
  return isValid;
}

function validatePhotos(animal) {
  const start = Date.now();
  let isValid = true;

  if (Array.isArray(animal.photos)) {
    animal.photos.forEach(photo => {
      ['small','medium','large','full'].forEach(size => {
        if (photo[size] && !photo[size].startsWith('http')) {
          console.warn(`Invalid photo URL for size ${size}`);
          isValid = false;
        }
      });
    });
  }

  photoValidationDuration.add(Date.now() - start);
  return isValid;
}

export default function (token) {
  const res = http.get('https://api.petfinder.com/v2/animals', {
    headers: { Authorization: `Bearer ${token}` },
  });

  check(res, { 'status is 200': r => r.status === 200 });
  if (res.status !== 200) return;

  let data;
  try {
    data = res.json();
  } catch {
    console.error('Response not valid JSON');
    return;
  }

  let invalidCount = 0;
  if (Array.isArray(data.animals)) {
    data.animals.forEach(a => {
      const okA = validateAnimal(a);
      const okP = validatePhotos(a);
      if (!okA || !okP) invalidCount++;
    });
    invalidAnimals.add(invalidCount > 0 ? 1 : 0);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    stdout:                         textSummary(data, { indent: ' ', enableColors: true }),
    './load-test-results/summary.json': JSON.stringify(data, null, 2),
  };
}