import { render, screen } from '@testing-library/react';
import StraturaOS from '../../pages/index';

test('renders header', () => {
  render(<StraturaOS initialEvents={[]} initialCourses={[]} />);
  expect(screen.getByText(/StraturaOS/i)).toBeInTheDocument();
});
