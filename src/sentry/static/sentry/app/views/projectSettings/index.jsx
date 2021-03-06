import React from 'react';
import OrganizationState from '../../mixins/organizationState';
import ApiMixin from '../../mixins/apiMixin';
import Badge from '../../components/badge';
import ListLink from '../../components/listLink';
import LoadingError from '../../components/loadingError';
import LoadingIndicator from '../../components/loadingIndicator';
import {t} from '../../locale';

const ProjectSettings = React.createClass({
  propTypes: {
    setProjectNavSection: React.PropTypes.func
  },

  contextTypes: {
    location: React.PropTypes.object,
    organization: React.PropTypes.object
  },

  mixins: [ApiMixin, OrganizationState],

  getInitialState() {
    return {
      loading: true,
      error: false,
      project: null
    };
  },

  componentWillMount() {
    this.props.setProjectNavSection('settings');
    this.fetchData();
  },

  componentWillReceiveProps(nextProps) {
    let params = this.props.params;
    if (
      nextProps.params.projectId !== params.projectId ||
      nextProps.params.orgId !== params.orgId
    ) {
      this.setState(
        {
          loading: true,
          error: false
        },
        this.fetchData
      );
    }
  },

  fetchData() {
    let params = this.props.params;

    this.api.request(`/projects/${params.orgId}/${params.projectId}/`, {
      success: data => {
        this.setState({
          project: data,
          loading: false,
          error: false
        });
      },
      error: () => {
        this.setState({
          loading: false,
          error: true
        });
      }
    });
  },

  render() {
    let access = this.getAccess();
    // TODO(dcramer): move sidebar into component
    if (this.state.loading) return <LoadingIndicator />;
    else if (this.state.error) return <LoadingError onRetry={this.fetchData} />;

    let {orgId, projectId} = this.props.params;
    let settingsUrlRoot = `/${orgId}/${projectId}/settings`;
    let project = this.state.project;
    let features = new Set(project.features);
    let rootInstallPath = `/${orgId}/${projectId}/settings/install/`;
    let isEarlyAdopter = this.context.organization.isEarlyAdopter;
    let path = this.props.location.pathname;
    let processingIssues = this.state.project.processingIssues;

    return (
      <div className="row">
        <div className="col-md-2">
          <h6 className="nav-header">{t('Configuration')}</h6>
          <ul className="nav nav-stacked">
            <li><a href={`${settingsUrlRoot}/`}>{t('General')}</a></li>
            <ListLink
              to={`/${orgId}/${projectId}/settings/alerts/`}
              isActive={loc => path.indexOf(loc.pathname) === 0}>
              {t('Alerts')}
            </ListLink>
            {features.has('quotas') &&
              <li><a href={`${settingsUrlRoot}/quotas/`}>{t('Rate Limits')}</a></li>}
            <li><a href={`${settingsUrlRoot}/tags/`}>{t('Tags')}</a></li>
            <li>
              <a href={`${settingsUrlRoot}/issue-tracking/`}>{t('Issue Tracking')}</a>
            </li>
            {access.has('project:write') &&
              <ListLink
                to={`/${orgId}/${projectId}/settings/release-tracking/`}
                isActive={loc => path.indexOf(loc.pathname) === 0}>
                {t('Release Tracking')}
              </ListLink>}
            <ListLink to={`/${orgId}/${projectId}/settings/data-forwarding/`}>
              {t('Data Forwarding')}
            </ListLink>
            <ListLink to={`/${orgId}/${projectId}/settings/saved-searches/`}>
              {t('Saved Searches')}
            </ListLink>
            <ListLink to={`/${orgId}/${projectId}/settings/debug-symbols/`}>
              {t('Debug Symbols')}
            </ListLink>
            <ListLink
              className="badged"
              to={`/${orgId}/${projectId}/settings/processing-issues/`}>
              {t('Processing Issues')}
              {processingIssues > 0 &&
                <Badge
                  text={processingIssues > 99 ? '99+' : processingIssues + ''}
                  isNew={true}
                />}
            </ListLink>
          </ul>
          <h6 className="nav-header">{t('Data')}</h6>
          <ul className="nav nav-stacked">
            <ListLink
              to={rootInstallPath}
              isActive={loc => {
                // Because react-router 1.0 removes router.isActive(route)
                return path === rootInstallPath || /install\/[\w\-]+\/$/.test(path);
              }}>
              {t('Error Tracking')}
            </ListLink>
            {isEarlyAdopter &&
              <ListLink to={`/${orgId}/${projectId}/settings/csp/`}>
                {t('CSP Reports')}
              </ListLink>}
            <ListLink to={`/${orgId}/${projectId}/settings/user-feedback/`}>
              {t('User Feedback')}
            </ListLink>
            <ListLink to={`/${orgId}/${projectId}/settings/filters/`}>
              {t('Inbound Filters')}
            </ListLink>
            <ListLink to={`/${orgId}/${projectId}/settings/keys/`}>
              {t('Client Keys')} (DSN)
            </ListLink>
          </ul>
          <h6 className="nav-header">{t('Integrations')}</h6>
          <ul className="nav nav-stacked">
            <li><a href={`${settingsUrlRoot}/plugins/`}>{t('All Integrations')}</a></li>
            {project.plugins.filter(p => p.enabled).map(plugin => {
              return (
                <li key={plugin.id}>
                  <a href={`${settingsUrlRoot}/plugins/${plugin.id}/`}>{plugin.name}</a>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="col-md-10">
          {React.cloneElement(this.props.children, {
            setProjectNavSection: this.props.setProjectNavSection,
            project: project,
            organization: this.context.organization
          })}
        </div>
      </div>
    );
  }
});

export default ProjectSettings;
