import { Navigate, useParams } from 'react-router-dom';
import { findDocCourse } from './DocChapterPage';
import docsRegistry from '../data/docsRegistry.json';

/**
 * DocCoursePage — /courses/:categoryId/:courseId
 * Docs categories open straight into the first chapter's lesson view —
 * same as clicking an AWS chapter card opens its lesson.
 */
export default function DocCoursePage() {
  const { categoryId, courseId } = useParams();
  const cat = docsRegistry.categories.find(c => c.id === categoryId);
  const { course } = findDocCourse(categoryId, courseId);
  const first = course?.chapters[0];
  // Not a docs category or unknown course → back to the category listing.
  if (!cat || !course || !first) return <Navigate to={`/courses/${categoryId}`} replace />;
  return <Navigate to={`/courses/${categoryId}/${course.id}/${first.id}`} replace />;
}
