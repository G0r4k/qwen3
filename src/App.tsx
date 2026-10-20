import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store/useStore';
import Home from './components/Home';
import Create from './components/Create';
import Editor from './components/Editor';
import FullPreview from './components/FullPreview';
import AISettingsModal from './components/AISettings';

export default function App() {
  const vista = useStore((s) => s.vista);

  return (
    <div className="min-h-screen">
      <div className="mv-bg" />
      <div className="mv-grain" />
      <AnimatePresence mode="wait">
        <motion.div key={vista} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
          {vista === 'home' && <Home />}
          {vista === 'crear' && <Create />}
          {vista === 'editor' && <Editor />}
          {vista === 'preview' && <FullPreview />}
        </motion.div>
      </AnimatePresence>
      <AISettingsModal />
    </div>
  );
}
