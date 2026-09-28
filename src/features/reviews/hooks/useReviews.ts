import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  Project,
  ReviewActionItem,
  SystemReview,
  Task,
  ValueGoal,
  Vision,
  Pillar,
  WorshipDefinition,
  WorshipLog,
} from '../../../types/hierarchical';
import { generateSystemSnapshot } from '../../../utils/reviewEngine';
import { createId } from '../../../utils/id';
import { toLocalDateKey } from '../../../utils/date';

type Setter<T> = Dispatch<SetStateAction<T>>;

interface ReviewDependencies {
  reviews: SystemReview[];
  setReviews: Setter<SystemReview[]>;
  editingReview: SystemReview | null;
  pillars: Pillar[];
  visions: Vision[];
  goals: ValueGoal[];
  projects: Project[];
  tasks: Task[];
  worshipDefinitions: WorshipDefinition[];
  worshipLogs: WorshipLog[];
  applyStateUpdate: (
    pillars: Pillar[],
    visions: Vision[],
    goals: ValueGoal[],
    projects: Project[],
    tasks: Task[],
  ) => void;
  onCloseEditor: () => void;
}

export function useReviews({
  reviews,
  setReviews,
  editingReview,
  pillars,
  visions,
  goals,
  projects,
  tasks,
  worshipDefinitions,
  worshipLogs,
  applyStateUpdate,
  onCloseEditor,
}: ReviewDependencies) {
  const saveReview = useCallback(
    (reviewData: Partial<SystemReview>) => {
      let updated: SystemReview[];
      if (editingReview) {
        updated = reviews.map((review) =>
          review.id === editingReview.id
            ? ({ ...review, ...reviewData, updated_at: new Date().toISOString() } as SystemReview)
            : review,
        );
      } else {
        const newReview: SystemReview = {
          id: createId(),
          frequency: reviewData.frequency || 'daily',
          date: reviewData.date || toLocalDateKey(),
          title: reviewData.title || 'مراجعة دورية',
          rating: reviewData.rating || 8,
          focus_pillar_id: reviewData.focus_pillar_id || null,
          wins: reviewData.wins || '',
          challenges: reviewData.challenges || '',
          lessons: reviewData.lessons || '',
          next_commitments: reviewData.next_commitments || '',
          notes: reviewData.notes || '',
          snapshot:
            reviewData.snapshot ||
            generateSystemSnapshot(
              pillars,
              visions,
              goals,
              projects,
              tasks,
              reviewData.focus_pillar_id,
              worshipDefinitions,
              worshipLogs,
            ),
          system_health_score: reviewData.system_health_score || 80,
          smart_summary: reviewData.smart_summary || '',
          strengths: reviewData.strengths || [],
          bottlenecks: reviewData.bottlenecks || [],
          recommendations: reviewData.recommendations || [],
          action_items: reviewData.action_items || [],
          created_at: new Date().toISOString(),
        };
        updated = [newReview, ...reviews];
      }
      setReviews(updated);
      onCloseEditor();
    },
    [
      editingReview,
      goals,
      onCloseEditor,
      pillars,
      projects,
      reviews,
      setReviews,
      tasks,
      visions,
      worshipDefinitions,
      worshipLogs,
    ],
  );

  const deleteReview = useCallback(
    (reviewId: string) => {
      if (!confirm('هل أنت متأكد من حذف هذه المراجعة؟')) return;
      setReviews((current) => current.filter((review) => review.id !== reviewId));
    },
    [setReviews],
  );

  const convertActionToTask = useCallback(
    (actionItem: ReviewActionItem, reviewId: string) => {
      const targetProjectId = actionItem.project_id || projects[0]?.id;
      if (!targetProjectId) {
        alert('يرجى إنشاء مشروع أولاً لإسناد المهمة إليه.');
        return;
      }
      const newTask: Task = {
        id: createId(),
        project_id: targetProjectId,
        title: actionItem.title,
        description: 'مهمة مستخلصة تلقائياً من جلسة المراجعة الدورية والتدقيق التحليلي',
        status: 'todo',
        priority: actionItem.priority || 'medium',
        due_date: toLocalDateKey(),
        completed_at: null,
        created_at: new Date().toISOString(),
      };
      const updatedTasks = [newTask, ...tasks];
      applyStateUpdate(pillars, visions, goals, projects, updatedTasks);
      setReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                action_items: review.action_items.map((item) =>
                  item.id === actionItem.id ? { ...item, is_converted: true } : item,
                ),
              }
            : review,
        ),
      );
    },
    [applyStateUpdate, goals, pillars, projects, setReviews, tasks, visions],
  );

  return { saveReview, deleteReview, convertActionToTask };
}
