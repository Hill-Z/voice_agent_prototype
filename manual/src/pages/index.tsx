import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className="row">
          <div className="col col--10 col--offset-1 text-center">
            <div className={styles.logoWrapper}>
              <div className={styles.microphoneIcon}>
                <svg className={styles.icon} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="14" y="4" width="20" height="26" rx="10" fill="white" fillOpacity="0.95"/>
                  <path d="M24 14C21.7909 14 20 15.7909 20 18V26C20 28.2091 21.7909 30 24 30C26.2091 30 28 28.2091 28 26V18C28 15.7909 26.2091 14 24 14Z" fill="rgba(255,255,255,0.3)"/>
                  <rect x="20" y="30" width="8" height="10" rx="2" fill="white" fillOpacity="0.9"/>
                  <rect x="17" y="40" width="14" height="4" rx="2" fill="white" fillOpacity="0.8"/>
                </svg>
              </div>
            </div>
            <Heading as="h1" className={clsx('hero__title', styles.title)}>
              {siteConfig.title}
            </Heading>
            <p className={clsx('hero__subtitle', styles.subtitle)}>
              {siteConfig.tagline}
            </p>
            <div className={styles.buttons}>
              <Link
                className="button button--primary button--lg"
                to="/docs/getting-started/activation">
                <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                文档中心
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/docs/blog">
                <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1"/>
                  <path d="M21 10H9"/>
                  <path d="M9 10v11"/>
                  <path d="M15 10v11"/>
                </svg>
                产品博客
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function FeatureCard({title, description, link, icon}) {
  return (
    <Link to={link} className={clsx('col col--4', styles.featureCard)}>
      <div className={styles.featureIcon}>
        <div className={styles.featureIconInner}>{icon}</div>
      </div>
      <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
      <p className={styles.featureDescription}>{description}</p>
    </Link>
  );
}

function HomepageFeatures() {
  const features = [
    {
      title: '快速开始',
      description: '通过详细的入门指南，快速上手语音智能体的配置和使用。',
      link: '/docs/getting-started/activation',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
    },
    {
      title: '配置指南',
      description: '深入了解语音智能体的各项配置选项，打造个性化服务。',
      link: '/docs/configuration/basic-settings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
    {
      title: '外呼任务',
      description: '学习如何创建和管理外呼任务，提升业务效率。',
      link: '/docs/outbound/outbound-template',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
    },
    {
      title: '对话策略',
      description: '配置智能对话流程，实现自动化客户服务。',
      link: '/docs/configuration/conversation-policy',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      title: 'API 参考',
      description: '了解系统 API 接口，实现第三方系统集成。',
      link: '/docs/api/api-reference',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6"/>
          <polyline points="8 6 2 12 8 18"/>
        </svg>
      ),
    },
    {
      title: '常见问题',
      description: '查找常见问题解决方案，快速排除故障。',
      link: '/docs/faq/troubleshooting',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
    },
  ];

  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className={styles.featuresTitle}>功能模块</Heading>
        <p className={styles.featuresSubtitle}>
          全面的功能文档，帮助您充分利用语音智能体的各项能力
        </p>
        <div className="row">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickLinks() {
  const links = [
    {label: '机器人开通', href: '/docs/getting-started/activation'},
    {label: '基础配置', href: '/docs/configuration/basic-settings'},
    {label: '对话策略', href: '/docs/configuration/conversation-policy'},
    {label: '变量配置', href: '/docs/configuration/variables'},
    {label: '外呼模板', href: '/docs/outbound/outbound-template'},
    {label: '术语表', href: '/docs/glossary'},
  ];

  return (
    <section className={styles.quickLinks}>
      <div className="container">
        <Heading as="h2" className={styles.linksTitle}>快速导航</Heading>
        <div className="row">
          {links.map((link, index) => (
            <div key={index} className={clsx('col col--2', styles.linkItem)}>
              <Link to={link.href} className={styles.link}>
                {link.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - 文档中心`}
      description="语音智能体产品操作手册">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <QuickLinks />
      </main>
    </Layout>
  );
}
