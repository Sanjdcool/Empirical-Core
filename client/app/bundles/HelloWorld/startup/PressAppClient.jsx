import React from 'react';
import PreviewCard from '../components/shared/preview_card.jsx';
import HeaderSection from '../components/blog_posts/header_section'

export default (props) => {
  const content = props.blogPosts.length > 0 ? props.blogPosts.map(article =>
    <PreviewCard content={article.preview_card_content} link={`/teacher_resources/${article.slug}`} />
  ) : <div style={{fontSize: '30px', display: 'flex', justifyContent: 'center', height: '60vh', alignItems: 'center', flexDirection: 'column', fontWeight: 'bold'}}>
        Coming Soon!
        <img style={{marginTop: '20px'}} src="https://assets.quill.org/images/illustrations/empty-state-premium-reports.svg"/>
      </div>
    return <div className="press-page">
      <HeaderSection title="In the Press" subtitle="Read articles that feature Quill"/>
      <div id="preview-card-container">
        {content}
      </div>
    </div>

}
