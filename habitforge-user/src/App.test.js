import { render, screen } from '@testing-library/react';
import App from './App';

test('renders HabitForge brand in navbar', () => {
  render(<App />);
  const brandElement = screen.getByText(/HabitForge/i);
  expect(brandElement).toBeInTheDocument();
});