/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'
import { Input, RadioGroup, Columns, Column } from '@pitrix/lego-ui'
import { Modal, Form, Checkbox } from 'components/Base'
import BuilderStore from 'stores/s2i/builder'

import RadioItem from './item'
import styles from './index.scss'

export default class ReBuild extends React.Component {
  static propTypes = {
    visible: PropTypes.bool,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    isSubmitting: PropTypes.bool,
  }

  static defaultProps = {
    visible: false,
    onOk() {},
    onCancel() {},
    isSubmitting: false,
    builderNames: [],
  }

  constructor(props) {
    super(props)

    this.form = React.createRef()
    this.state = { urls: {}, data: {} }
    this.store = new BuilderStore()
  }

  componentWillReceiveProps(nextProps) {
    const { builderNames } = nextProps

    if (builderNames.length && !this.props.builderNames.length) {
      this.fetchBuilders(builderNames)
    }
  }

  fetchBuilders = builderNames => {
    const { namespace } = this.props
    const promiseArr = builderNames.map(async name => {
      const result = await this.store.fetchBuilderDetail({ name, namespace })
      const url = get(result, 'spec.config.sourceUrl', '')
      this.setState({ urls: { ...this.state.urls, [name]: url } })
    })
    Promise.all(promiseArr)
  }

  handleOk = () => {
    const { onOk } = this.props
    if (this.form) {
      const current = this.form.current || {}
      const formData = current.getData()
      onOk(formData)
    }
  }

  renderBuilderSelector = () => {
    const { builderNames } = this.props
    return (
      <div className={styles.builderSelector}>
        <Form.Item>
          <RadioGroup
            direction="column"
            name="builderName"
            defaultValue={builderNames && builderNames[0]}
          >
            {builderNames.map(builderName => (
              <RadioItem
                key={builderName}
                builderName={builderName}
                url={this.state.urls[builderName]}
                value={builderName}
              />
            ))}
          </RadioGroup>
        </Form.Item>
      </div>
    )
  }

  renderEnableUpdate = () => (
    <div className={styles.checkboxCard}>
      <label>
        <Form.Item>
          <Checkbox name="isUpdateWorkload" defaultValue={true}>
            <span className={styles.title}>{t('S2I_UPDATE_WORKLOAD')}</span>
          </Checkbox>
        </Form.Item>
      </label>
      <p className={styles.desc}>{t('S2I_UPDATA_WORKLOAD_DESC')}</p>
    </div>
  )

  render() {
    const { visible, isSubmitting, onCancel } = this.props

    return (
      <Modal.Form
        formRef={this.form}
        data={this.state.data}
        width={691}
        title={t('Rerun')}
        icon="cdn"
        onOk={this.handleOk}
        okText={t('Rerun')}
        onCancel={onCancel}
        visible={visible}
        isSubmitting={isSubmitting}
      >
        <Columns>
          <Column>
            <Form.Item label={t('New Image Tag')}>
              <Input name="newTag" />
            </Form.Item>
          </Column>
          <Column>
            <Form.Item label={t('RevisionId')}>
              <Input name="revisionId" />
            </Form.Item>
          </Column>
        </Columns>
        {this.renderBuilderSelector()}
        {this.renderEnableUpdate()}
      </Modal.Form>
    )
  }
}
