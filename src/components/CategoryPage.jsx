import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useCourse } from '../context/CourseContext';
import CourseCard from './CourseCard';

/**
 * CategoryPage — /courses/:categoryId
 * Lists the items inside one course category (folder) using the shared
 * CourseCard grid. `kind` decides how each item maps to card props:
 *   'module' → interactive lesson card (icon/number/progress/meta)
 *   'course' → doc-library course card (icon/title/chapter count)
 */
export default function CategoryPage({ categories = [] }) {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { progress } = useCourse();
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return <Navigate to="/" replace />;

  const cardProps = (item) => {
    if (cat.kind === 'module') {
      const pct = progress.getModuleProgress(item.id);
      return {
        icon: item.icon, iconBg: item.colorBg, iconColor: item.color,
        number: item.number, title: item.title,
        description: item.productionStory || item.description,
        progress: { pct, complete: progress.isModuleComplete(item.id) },
        meta: [{ value: item.difficulty }, `⏱ ${item.duration}`, `📝 ${item.lessons?.length || 0} lessons`],
      };
    }
    return {
      icon: item.icon, iconBg: cat.colorBg, iconColor: cat.color,
      title: item.title,
      description: item.description,
      meta: [`📄 ${item.chapters.length} chapters`],
    };
  };

  return (
    <div className="doc-page">
      <header className="doc-header">
        <Link to="/" className="btn btn-sm btn-ghost" style={{ textDecoration: 'none' }}>← Back to Course</Link>
        <div className="doc-header-title">
          <span className="doc-header-icon">{cat.icon}</span>
          <div>
            <div className="doc-header-name">Course Category</div>
            <div className="doc-header-course">{cat.title}</div>
          </div>
        </div>
      </header>
      <div className="doc-body doc-body-wide">
        <div className="module-grid stagger-children">
          {cat.items.map(item => (
            <CourseCard key={item.id} {...cardProps(item)} onClick={() => navigate(cat.itemTo(item))} />
          ))}
        </div>
      </div>
    </div>
  );
}
