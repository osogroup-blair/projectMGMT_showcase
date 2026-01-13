import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useLocation, useSearch } from 'wouter';
import type { 
  TaskInspectorState, 
  InspectorOriginContext, 
  NavigationStackItem,
  InspectorWidthPreset 
} from '@/components/task-inspector/types';

interface TaskInspectorContextValue extends TaskInspectorState {
  openTaskInspector: (taskId: string, projectId: string, context?: InspectorOriginContext) => void;
  closeTaskInspector: () => void;
  navigateToSubtask: (taskId: string, title: string) => void;
  goBack: () => void;
  setWidthPreset: (preset: InspectorWidthPreset) => void;
  canGoBack: boolean;
  currentTaskId: string | null;
}

const TaskInspectorContext = createContext<TaskInspectorContextValue | null>(null);

const STORAGE_KEY = 'task-inspector-width';

export function TaskInspectorProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  const [state, setState] = useState<TaskInspectorState>(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEY) as InspectorWidthPreset | null;
    return {
      isOpen: false,
      taskId: null,
      projectId: null,
      originContext: null,
      navigationStack: [],
      widthPreset: savedWidth && ['S', 'M', 'L'].includes(savedWidth) ? savedWidth : 'M',
    };
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const inspectorTaskId = params.get('inspector');
    const inspectorProjectId = params.get('inspectorProject');
    
    if (inspectorTaskId && inspectorProjectId && !state.isOpen) {
      setState(prev => ({
        ...prev,
        isOpen: true,
        taskId: inspectorTaskId,
        projectId: inspectorProjectId,
        navigationStack: [],
      }));
    }
  }, [searchString]);

  const updateUrlParam = useCallback((taskId: string | null, projectId: string | null) => {
    const params = new URLSearchParams(searchString);
    if (taskId && projectId) {
      params.set('inspector', taskId);
      params.set('inspectorProject', projectId);
    } else {
      params.delete('inspector');
      params.delete('inspectorProject');
    }
    const newSearch = params.toString();
    const currentPath = window.location.pathname;
    setLocation(newSearch ? `${currentPath}?${newSearch}` : currentPath, { replace: true });
  }, [searchString, setLocation]);

  const openTaskInspector = useCallback((taskId: string, projectId: string, context?: InspectorOriginContext) => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      taskId,
      projectId,
      originContext: context || null,
      navigationStack: [],
    }));
    updateUrlParam(taskId, projectId);
  }, [updateUrlParam]);

  const closeTaskInspector = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      taskId: null,
      projectId: null,
      originContext: null,
      navigationStack: [],
    }));
    updateUrlParam(null, null);
  }, [updateUrlParam]);

  const navigateToSubtask = useCallback((taskId: string, title: string) => {
    setState(prev => {
      if (!prev.taskId) return prev;
      
      const currentItem: NavigationStackItem = {
        taskId: prev.navigationStack.length > 0 
          ? prev.navigationStack[prev.navigationStack.length - 1].taskId 
          : prev.taskId,
        title: title,
      };
      
      return {
        ...prev,
        taskId,
        navigationStack: [...prev.navigationStack, { taskId: prev.taskId, title: 'Parent Task' }],
      };
    });
  }, []);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.navigationStack.length === 0) return prev;
      
      const newStack = [...prev.navigationStack];
      const previousItem = newStack.pop()!;
      
      return {
        ...prev,
        taskId: previousItem.taskId,
        navigationStack: newStack,
      };
    });
  }, []);

  const setWidthPreset = useCallback((preset: InspectorWidthPreset) => {
    localStorage.setItem(STORAGE_KEY, preset);
    setState(prev => ({ ...prev, widthPreset: preset }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.isOpen) {
        closeTaskInspector();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.isOpen, closeTaskInspector]);

  const currentTaskId = state.navigationStack.length > 0 
    ? state.taskId 
    : state.taskId;

  const value: TaskInspectorContextValue = {
    ...state,
    openTaskInspector,
    closeTaskInspector,
    navigateToSubtask,
    goBack,
    setWidthPreset,
    canGoBack: state.navigationStack.length > 0,
    currentTaskId,
  };

  return (
    <TaskInspectorContext.Provider value={value}>
      {children}
    </TaskInspectorContext.Provider>
  );
}

export function useTaskInspector() {
  const context = useContext(TaskInspectorContext);
  if (!context) {
    throw new Error('useTaskInspector must be used within TaskInspectorProvider');
  }
  return context;
}
