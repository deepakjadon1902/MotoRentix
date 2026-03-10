import vehicleBike1 from '@/assets/vehicle-bike-1.jpg';
import vehicleBike2 from '@/assets/vehicle-bike-2.jpg';
import vehicleBike3 from '@/assets/vehicle-bike-3.jpg';
import vehicleScooter1 from '@/assets/vehicle-scooter-1.jpg';
import vehicleScooter2 from '@/assets/vehicle-scooter-2.jpg';
import vehicleScooter3 from '@/assets/vehicle-scooter-3.jpg';

export interface Vehicle {
  id: string;
  name: string;
  category: 'Bike' | 'Scooter';
  image: string;
  pricePerHour: number;
  pricePerDay: number;
  rating: number;
  available: boolean;
  description: string;
  specifications: { label: string; value: string }[];
}

export const vehicles: Vehicle[] = [
  {
    id: 'bike-1',
    name: 'Shadow Phantom 750',
    category: 'Bike',
    image: vehicleBike1,
    pricePerHour: 150,
    pricePerDay: 1200,
    rating: 4.8,
    available: true,
    description: 'A sleek sport-touring motorcycle built for speed and comfort. Perfect for long highway rides with its aerodynamic design and powerful engine.',
    specifications: [
      { label: 'Engine', value: '749cc Inline-4' },
      { label: 'Power', value: '104 HP' },
      { label: 'Top Speed', value: '220 km/h' },
      { label: 'Mileage', value: '22 km/l' },
      { label: 'Weight', value: '210 kg' },
      { label: 'Fuel Tank', value: '17L' },
    ],
  },
  {
    id: 'bike-2',
    name: 'Blaze Street 650',
    category: 'Bike',
    image: vehicleBike2,
    pricePerHour: 120,
    pricePerDay: 950,
    rating: 4.6,
    available: true,
    description: 'A naked street fighter with aggressive styling and raw performance. Ideal for city commutes and weekend thrills.',
    specifications: [
      { label: 'Engine', value: '649cc Twin Cylinder' },
      { label: 'Power', value: '87 HP' },
      { label: 'Top Speed', value: '195 km/h' },
      { label: 'Mileage', value: '25 km/l' },
      { label: 'Weight', value: '187 kg' },
      { label: 'Fuel Tank', value: '15L' },
    ],
  },
  {
    id: 'bike-3',
    name: 'Thunder Cruiser 500',
    category: 'Bike',
    image: vehicleBike3,
    pricePerHour: 100,
    pricePerDay: 800,
    rating: 4.5,
    available: false,
    description: 'A classic cruiser motorcycle with timeless design and comfortable riding position. Built for relaxed long-distance touring.',
    specifications: [
      { label: 'Engine', value: '499cc Single' },
      { label: 'Power', value: '40 HP' },
      { label: 'Top Speed', value: '150 km/h' },
      { label: 'Mileage', value: '30 km/l' },
      { label: 'Weight', value: '195 kg' },
      { label: 'Fuel Tank', value: '13L' },
    ],
  },
  {
    id: 'scooter-1',
    name: 'Volt E-Glide',
    category: 'Scooter',
    image: vehicleScooter1,
    pricePerHour: 60,
    pricePerDay: 450,
    rating: 4.7,
    available: true,
    description: 'A futuristic electric scooter with zero emissions and whisper-quiet operation. Perfect for eco-conscious city commuters.',
    specifications: [
      { label: 'Motor', value: '3kW Electric' },
      { label: 'Range', value: '120 km' },
      { label: 'Top Speed', value: '80 km/h' },
      { label: 'Charge Time', value: '4 hrs' },
      { label: 'Weight', value: '98 kg' },
      { label: 'Battery', value: '3.2 kWh Li-ion' },
    ],
  },
  {
    id: 'scooter-2',
    name: 'Zephyr Sport 125',
    category: 'Scooter',
    image: vehicleScooter2,
    pricePerHour: 50,
    pricePerDay: 400,
    rating: 4.4,
    available: true,
    description: 'A sporty scooter with excellent handling and fuel efficiency. Great for daily commuting with ample underseat storage.',
    specifications: [
      { label: 'Engine', value: '124.6cc' },
      { label: 'Power', value: '10.5 HP' },
      { label: 'Top Speed', value: '95 km/h' },
      { label: 'Mileage', value: '45 km/l' },
      { label: 'Weight', value: '108 kg' },
      { label: 'Fuel Tank', value: '5.3L' },
    ],
  },
  {
    id: 'scooter-3',
    name: 'Nova Ride 110',
    category: 'Scooter',
    image: vehicleScooter3,
    pricePerHour: 40,
    pricePerDay: 300,
    rating: 4.3,
    available: true,
    description: 'A lightweight and affordable scooter perfect for short city rides. Easy to handle with great fuel economy.',
    specifications: [
      { label: 'Engine', value: '109.7cc' },
      { label: 'Power', value: '8 HP' },
      { label: 'Top Speed', value: '83 km/h' },
      { label: 'Mileage', value: '55 km/l' },
      { label: 'Weight', value: '95 kg' },
      { label: 'Fuel Tank', value: '5L' },
    ],
  },
];
