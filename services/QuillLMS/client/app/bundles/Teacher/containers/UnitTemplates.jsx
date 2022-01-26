import React from 'react'
import request from 'request'
import ReactTable from 'react-table'

import ItemDropdown from '../components/general_components/dropdown_selectors/item_dropdown';
import LoadingSpinner from '../../Connect/components/shared/loading_indicator.jsx'
import { SortableList, } from  '../../Shared/index'
import UnitTemplateRow from './unit_template_row'
import UnitTemplateActivityRow from './unit_template_activity_row'
import getAuthToken from '../components/modules/get_auth_token'

import UnitTemplate from '../components/unit_templates/unit_template.jsx'
import Cms from './Cms.jsx'

const UNIT_TEMPLATES_URL = `${process.env.DEFAULT_URL}/cms/unit_templates.json`
const DIAGNOSTICS_URL = `${process.env.DEFAULT_URL}/api/v1/activities/diagnostic_activities.json`
const NO_DATA_FOUND_MESSAGE = "Activity Packs data could not be found. Refresh to try again, or contact the engineering team."
const ALL_FLAGS = 'All'

export default class UnitTemplates extends React.Component {

  state = {
    loadingTableData: true,
    flag: 'All',
    fetchedData: [],
    activitySearchInput: "",
    dataToDownload: [],
    diagnostics: [],
    diagnostic: 'All',
  };

  shouldComponentUpdate(nextProps, nextState){
    return !(this.state === nextState)
  }

  componentDidMount() {
    this.fetchUnitTemplatesData();
    this.fetchDiagnosticsData();
  }

  fetchDiagnosticsData() {
    request.get({
      url: DIAGNOSTICS_URL,
    }, (e, r, body) => {
      let newState = {}
      if (e || r.statusCode != 200) {
        console.log("dont got it")
        diagnostics = []
      } else {
        const data = JSON.parse(body);
        this.setState({diagnostics: data.diagnostics})
      }
    });
  }

  fetchUnitTemplatesData() {
    this.setState({ loadingTableData: true })
    request.get({
      url: UNIT_TEMPLATES_URL,
    }, (e, r, body) => {
      let newState = {}
      if (e || r.statusCode != 200) {
        console.log("dont got it")
        newState = {
          loadingTableData: false,
          dataResults: [],
        }
      } else {
        console.log("got it")
        const data = JSON.parse(body);
        console.log(data)
        newState = {
          loadingTableData: false,
          fetchedData: data.unit_templates
        };
      }
      this.setState(newState)
    });
  }

  updateOrder = (sortInfo) => {
    console.log("sort info")
    console.log(sortInfo)
    if (this.isSortable()) {
      console.log("sorting ")
      const { fetchedData, } = this.state
      const newOrder = sortInfo.map(item => item.key);
      const newOrderedUnitTemplates = fetchedData.map((ut, i) => {
      const newUnitTemplate = ut
      const newIndex = newOrder.findIndex(key => Number(key) === Number(ut.id))
      if (newIndex !== -1) {
        newUnitTemplate['order_number'] = newIndex
      }
        return newUnitTemplate
      })



      const link = `${process.env.DEFAULT_URL}/cms/unit_templates/update_order_numbers`
        // console.log("updated orders")
        // console.log(unitTemplates)
      const data = new FormData();
      data.append( "unit_templates", JSON.stringify(newOrderedUnitTemplates) );
      fetch(link, {
        method: 'PUT',
        mode: 'cors',
        credentials: 'include',
        body: data,
        headers: {
          'X-CSRF-Token': getAuthToken()
        }
      }).then((response) => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      }).then((response) => {
        alert(`Order for activity packs has been saved.`)
      }).catch((error) => {
        // to do, use Sentry to capture error
      })

      this.setState({fetchedData: newOrderedUnitTemplates});
    }


  };

  orderedUnitTemplates = () => {
    const { fetchedData, activitySearchInput, flag, diagnostic } = this.state
    let filteredData = fetchedData
    console.log(flag)

    if (flag === 'Not Archived') {
      filteredData = fetchedData.filter(data => data.flag != 'archived')
    } else if (flag != ALL_FLAGS) {
      filteredData = fetchedData.filter(data => data.flag === flag.toLowerCase())
    }

    if (activitySearchInput != '') {
      filteredData = filteredData.filter(value => {
        return (
          value.activities && value.activities.map(x => x.name || '').some(y => y.toLowerCase().includes(activitySearchInput.toLowerCase()))
        );
      })
    }

    if (diagnostic != 'All') {
      filteredData = filteredData.filter(value => {
        return (
          value.diagnostic_names && value.diagnostic_names.some(y => y.toLowerCase().includes(diagnostic.toLowerCase()))
        );
      })
    }

    return filteredData.sort((bp1, bp2) => {
      // Group archived activities at the bottom of the list (they automatically get a higher order number
      // than any unarchived activity)
      if (bp1.flag === 'archived' && bp2.flag !== 'archived') {
        return 1
      } else if (bp2.flag === 'archived' && bp1.flag != 'archived') {
        return -1
      }
      return bp1.order_number - bp2.order_number
    })
  }

  handleDelete = (id) => {
    const link = `${process.env.DEFAULT_URL}/cms/unit_templates/${id}`
    fetch(link, {
      method: 'DELETE',
      mode: 'cors',
      credentials: 'include',
      body: {},
      headers: {
        'X-CSRF-Token': getAuthToken()
      }
    }).then((response) => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    }).then((response) => {
      alert(`Activity pack was deleted.`)
      this.fetchUnitTemplatesData();
    }).catch((error) => {
      // to do, use Sentry to capture error
    })
  }

  updateUnitTemplate = (unitTemplate) => {
    console.log('new unit template')
    console.log(unitTemplate)
    let newUnitTemplate = unitTemplate
    newUnitTemplate.unit_template_category_id = unitTemplate.unit_template_category.id
    newUnitTemplate.activity_ids = unitTemplate.activity_ids || unitTemplate.activities.map((a) => a.id)
    const link = `${process.env.DEFAULT_URL}/cms/unit_templates/${unitTemplate.id}.json`
    // const data = new FormData();
    // data.append( "unit_template", JSON.stringify({}) );
    fetch(link, {
      method: 'PUT',
      mode: 'cors',
      credentials: 'include',
      body: JSON.stringify({unit_template: newUnitTemplate}),
      dataType: 'json',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': getAuthToken()
        }
      }).then((response) => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      }).then((response) => {
        alert(`Activity has been saved.`)
      }).catch((error) => {
        // to do, use Sentry to capture error
      })
  }

  renderTableRow(unitTemplate) {

    const { id, name, diagnostic_names, flag, order_number, activities, unit_template_category } = unitTemplate
    return (<UnitTemplateRow
      id={id}
      flag={flag}
      diagnostic_names={diagnostic_names}
      handleDelete={this.handleDelete}
      name={name}
      order_number={order_number}
      key={id}
      activities={activities}
      updateUnitTemplate={this.updateUnitTemplate}
      unitTemplate={unitTemplate}
      unit_template_category={unit_template_category}
    />)
  }

  tableOrEmptyMessage() {
    const { fetchedData } = this.state

    let tableOrEmptyMessage

    if (fetchedData) {
      console.log("data is fetched")
      // let dataToUse = this.getFilteredData()
      let dataToUse = this.orderedUnitTemplates()
      const unitTemplateRows = dataToUse.map((ut) => this.renderTableRow(ut))
      tableOrEmptyMessage = (
      <div class="blog-post-table">
        <table>
          {this.renderTableHeader()}
          <SortableList data={unitTemplateRows} sortCallback={this.updateOrder} />
        </table>
      </div>)
    } else {
      tableOrEmptyMessage = NO_DATA_FOUND_MESSAGE
    }
      return (
        <div>
          {tableOrEmptyMessage}
        </div>
      )
  }

  renderTable() {
    const { loadingTableData } = this.state
    if(loadingTableData) {
      return <LoadingSpinner />
    }
    return (this.tableOrEmptyMessage())
  }

  renderTableHeader() {
    return (<tr>
      <th className="name-col">Name</th>
      <th className="flag-col">Flag</th>
      <th className="diagnostics-col">Diagnostics</th>
      <th className="category-col">Category</th>
    </tr>)
  }

  switchDiagnostic = (diagnostic) => {
    this.setState({ diagnostic: diagnostic })
  }

  diagnosticsDropdown = () => {
    const { diagnostics, diagnostic } = this.state

    let diagnostic_names = diagnostics.map((d) => d.name)
    diagnostic_names.push('All')
    return (<ItemDropdown
      callback={this.switchDiagnostic}
      items={diagnostic_names}
      selectedItem={diagnostic}
    />)
  }

  handleSearchByActivity = (e) => {
    this.setState({ activitySearchInput: e.target.value })
  }

  switchFlag = (flag) => {
    this.setState({flag: flag})
  }

  isSortable = () => {
    const { flag, activitySearchInput, diagnostic } = this.state
    if(flag && !['All', 'Not Archived', 'Production'].includes(flag)) { return false }
    if (activitySearchInput != '') { return false}
    if (diagnostic != 'All') { return false}
    return true
  };



  render() {
    const { activitySearchInput, flag } = this.state
    const options = ['All', 'Not Archived', 'Archived', 'Alpha', 'Beta', 'Gamma', 'Production', 'Private']

    return (
      <div className="cms-unit-templates">
        <div className="standard-columns">
          <button className='button-green button-top' onClick={() => {window.open(`unit_templates/new`, '_blank')}}>New</button>
          <div className="unit-template-inputs">
            <label>Filter by flag</label>
            <ItemDropdown
              callback={this.switchFlag}
              items={options}
              selectedItem={flag}
            />
            <label>Search by diagnostic</label>
            {this.diagnosticsDropdown()}

            <input
                aria-label="Search by activity"
                className="search-box"
                name="searchInput"
                onChange={this.handleSearchByActivity}
                placeholder="Search by activity"
                value={activitySearchInput || ""}
              />
          </div>
          {this.tableOrEmptyMessage()}
        </div>
      </div>

    )
  }
}
