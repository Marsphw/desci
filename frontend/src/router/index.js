import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import MainLayout from '../components/MainLayout.vue';
import Dashboard from '../views/Dashboard.vue';
import Profile from '../views/Profile.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/dashboard',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: 'Dashboard' }
      }
    ]
  },
  {
    path: '/profile',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Profile',
        component: Profile,
        meta: { title: 'Profile' }
      }
    ]
  },
  {
    path: '/verify',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Verify',
        component: () => import('../views/Verify.vue'),
        meta: { title: 'Verify Academic Identity' }
      }
    ]
  },
  {
    path: '/explore',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Explore',
        component: () => import('../views/Explore.vue'),
        meta: { title: 'Explore Projects' }
      },
      {
        path: 'projects/:projectId',
        name: 'ExploreProjectDetail',
        component: () => import('../views/ExploreProjectDetail.vue'),
        meta: { title: 'Project Details' }
      },
      {
        path: 'datasets/:dataset_id',
        name: 'ExploreDatasetDetail',
        component: () => import('../views/ExploreDatasetDetail.vue'),
        meta: { title: 'Dataset Details' }
      }
    ]
  },
  {
    path: '/projects',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Projects',
        component: () => import('../views/Projects.vue'),
        meta: { title: 'Projects' }
      },
      {
        path: ':projectId',
        component: () => import('../views/layouts/ProjectLayout.vue'),
        props: true,
        children: [
          {
            path: '',
            name: 'ProjectDetail',
            component: () => import('../views/ProjectDetail.vue'),
            meta: { title: 'Project Details' }
          },
          {
            path: 'repository',
            name: 'ProjectRepository',
            component: () => import('../views/Repository.vue'),
            meta: { title: 'Repository' }
          },
          {
            path: 'collaborators',
            name: 'ProjectCollaborators',
            component: () => import('../views/Collaborators.vue'),
            meta: { title: 'Collaborators' }
          },
          {
            path: 'proof',
            name: 'ProjectProof',
            component: () => import('../views/Proof.vue'),
            meta: { title: 'Proof' }
          },
          {
            path: 'funding',
            name: 'ProjectFunding',
            component: () => import('../views/Funding.vue'),
            meta: { title: 'Funding' }
          },
          {
            path: 'nft',
            name: 'ProjectNFT',
            component: () => import('../views/NFT.vue'),
            meta: { title: 'NFT' }
          },
          {
            path: 'my-items',
            name: 'ProjectMyItems',
            component: () => import('../views/MyItems.vue'),
            meta: { title: 'My Items' }
          },
          {
            path: 'roadmap',
            name: 'ProjectRoadmap',
            component: () => import('../views/Roadmap.vue'),
            meta: { title: 'Roadmap' }
          }
        ]
      }
    ]
  },
  {
    path: '/datasets',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Datasets',
        component: () => import('../views/Datasets.vue'),
        meta: { title: 'My Datasets' }
      },
      {
        path: 'upload',
        name: 'DatasetUpload',
        component: () => import('../views/datasets/DatasetUpload.vue'),
        meta: { title: 'Upload Dataset' }
      }
    ]
  },
  {
    path: '/proof',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Proof',
        component: () => import('../views/Proof.vue'),
        meta: { title: 'Proofs' }
      },
      {
        path: 'generate',
        name: 'ProofGenerate',
        component: () => import('../views/datasets/GenerateProof.vue'),
        meta: { title: 'Generate ZK Proof' }
      },
      {
        path: 'details/:dataset_id',
        name: 'ProofDetails',
        component: () => import('../views/ProofDetails.vue'),
        meta: { title: 'Proof Details' }
      }
    ]
  },
  {
    path: '/datasets/:dataset_id',
    component: MainLayout,
    children: [
      { 
        path: '', 
        name: 'DatasetDetail', 
        component: () => import('../views/datasets/DatasetDetail.vue'), 
        meta: { title: 'Dataset Details' } 
      },
      { 
        path: 'edit', 
        name: 'DatasetEdit', 
        component: () => import('../views/datasets/DatasetEdit.vue'), 
        meta: { title: 'Datasets' } 
      }
    ]
  },
  {
    path: '/datasets/:dataset_id/permissions',
    component: MainLayout,
    children: [{ path: '', name: 'DatasetPermissions', component: () => import('../views/datasets/DatasetPermissions.vue'), meta: { title: 'Set Permissions' } }]
  },
  {
    path: '/datasets/:dataset_id/analytics',
    component: MainLayout,
    children: [{ path: '', name: 'DatasetAnalytics', component: () => import('../views/datasets/DatasetAnalytics.vue'), meta: { title: 'Usage Analytics' } }]
  },

  {
    path: '/datasets/encrypt',
    component: MainLayout,
    children: [{ path: '', name: 'DatasetEncrypt', component: () => import('../views/datasets/DatasetEncrypt.vue'), meta: { title: 'Encrypt Dataset' } }]
  },
  {
    path: '/zkp/private-query',
    component: MainLayout,
    children: [{ path: '', name: 'PrivateQuery', component: () => import('../views/datasets/PrivateQuery.vue'), meta: { title: 'Private Query' } }]
  },
  {
    path: '/publications',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Publications',
        component: () => import('../views/Publications.vue'),
        meta: { title: 'My Publications' }
      }
    ]
  },
  {
    path: '/papers',
    component: MainLayout,
    children: [
      {
        path: 'submit',
        name: 'PaperSubmit',
        component: () => import('../views/papers/PaperSubmit.vue'),
        meta: { title: 'Submit Paper' }
      },
      {
        path: ':paper_id',
        name: 'PaperDetail',
        component: () => import('../views/papers/PaperDetail.vue'),
        meta: { title: 'Paper Details' }
      },
      {
        path: ':paper_id/edit',
        name: 'PaperEdit',
        component: () => import('../views/papers/PaperEdit.vue'),
        meta: { title: 'Edit Paper' }
      },
      {
        path: ':paper_id/preview',
        name: 'PaperPreview',
        component: () => import('../views/papers/PaperPreview.vue'),
        meta: { title: 'Preview Paper' }
      },
      {
        path: ':paper_id/publish',
        name: 'PaperPublish',
        component: () => import('../views/papers/PaperPublish.vue'),
        meta: { title: 'Publish Paper' }
      }
    ]
  },
  {
    path: '/reviews',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Reviews',
        component: () => import('../views/Reviews.vue'),
        meta: { title: 'Review Tasks' }
      }
    ]
  },
  {
    path: '/nfts',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'NFTs',
        component: () => import('../views/NFT.vue'),
        meta: { title: 'NFTs' }
      }
    ]
  },
  {
    path: '/profile/:userIdentifier',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'PublicProfile',
        component: () => import('../views/PublicProfile.vue'),
        meta: { title: 'User Profile' }
      }
    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router; 