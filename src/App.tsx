import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AboutPage } from './features/about/AboutPage'
import { ArchitecturePage } from './features/about/ArchitecturePage'
import { InvestigationPage } from './features/investigation/InvestigationPage'
import { MetricDetailPage } from './features/metric/MetricDetailPage'
import { OverviewPage } from './features/overview/OverviewPage'
import { RegisterPage } from './features/register/RegisterPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="metrics" element={<RegisterPage />} />
        <Route path="metrics/:metricId" element={<MetricDetailPage />} />
        <Route path="investigations/:metricId" element={<InvestigationPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="architecture" element={<ArchitecturePage />} />
        <Route path="*" element={<p className="page">This page is not in the demo.</p>} />
      </Route>
    </Routes>
  )
}
