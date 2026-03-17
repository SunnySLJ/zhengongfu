import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AuthGuard from '../components/AuthGuard'
import PlaceholderPage from '../pages/PlaceholderPage'
import CopywritingPage from '../pages/Copywriting'
import TemplatePage from '../pages/Templates'
import AuthPage from '../pages/Auth'
import TeamOverview from '../pages/Team/Overview'
import TeamMembers from '../pages/Team/Members'
import TeamStores from '../pages/Team/Stores'
import TeamSettings from '../pages/Team/Settings'
import BatchMixPage from '../pages/BatchMix'
import VideoGenPage from '../pages/VideoGen'
import VideoHistoryPage from '../pages/VideoHistory'
import DistributionPage from '../pages/Distribution'
import TrendRadarPage from '../pages/TrendRadar'
import ZhenGongFuPage from '../pages/ZhenGongFu'
import PromptLibPage from '../pages/PromptLib'

export const router = createBrowserRouter([
  ...(import.meta.env.DEV
    ? [
        {
          path: '/zhengongfu',
          element: <ZhenGongFuPage />,
        },
      ]
    : []),
  {
    path: '/login',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <PlaceholderPage title="首页工作台" /> },
      // 帧功夫
      { path: 'zhengongfu', element: <ZhenGongFuPage /> },
      // 流量学院
      { path: 'trend-radar', element: <TrendRadarPage /> },
      { path: 'copywriting', element: <CopywritingPage /> },
      { path: 'templates', element: <TemplatePage /> },
      { path: 'batch-mix', element: <BatchMixPage /> },
      { path: 'video-gen', element: <VideoGenPage /> },
      { path: 'video-history', element: <VideoHistoryPage /> },
      { path: 'prompt-lib', element: <PromptLibPage /> },
      // 作品分发
      { path: 'distribution', element: <DistributionPage /> },
      { path: 'analytics', element: <PlaceholderPage title="数据看板" /> },
      // 素材预处理
      { path: 'materials', element: <PlaceholderPage title="本地素材" /> },
      // 隐藏但保留路由（创意空间 / 团队 / 学院课程）
      { path: 'projects', element: <PlaceholderPage title="创意项目" /> },
      { path: 'avatar', element: <PlaceholderPage title="数字分身" /> },
      { path: 'face-fusion', element: <PlaceholderPage title="人脸融合" /> },
      { path: 'courses', element: <PlaceholderPage title="学院课程" /> },
      { path: 'titles', element: <PlaceholderPage title="爆款标题" /> },
      { path: 'team', element: <TeamOverview /> },
      { path: 'stores', element: <TeamStores /> },
      { path: 'members', element: <TeamMembers /> },
      { path: 'team-settings', element: <TeamSettings /> },
    ],
  },
])
