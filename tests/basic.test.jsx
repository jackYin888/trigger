/* eslint-disable max-classes-per-file */

import React from 'react';
import ReactDOM from 'react-dom';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { spyElementPrototypes } from 'rc-util/lib/test/domHook';
import Portal from 'rc-util/lib/Portal';
import Trigger from '../src';
import { placementAlignMap } from './util';

describe('Trigger.Basic', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getPopupContainer', () => {
    it('defaults to document.body', () => {
      const wrapper = mount(
        <Trigger
          action={['click']}
          popupAlign={placementAlignMap.left}
          popup={<strong className="x-content">tooltip2</strong>}
        >
          <div className="target">click</div>
        </Trigger>,
      );

      wrapper.trigger();

      const popupDomNode = wrapper.instance().getPopupDomNode();
      expect(
        popupDomNode.parentNode.parentNode.parentNode instanceof
          HTMLBodyElement,
      ).toBeTruthy();
    });

    it('wrapper children with div when multiple children', () => {
      const wrapper = mount(
        <Trigger
          action={['click']}
          popupAlign={placementAlignMap.left}
          popup={[<div />, <div />]}
        >
          <div className="target">click</div>
        </Trigger>,
      );

      wrapper.trigger();

      expect(wrapper.find('.rc-trigger-popup-content').length).toBeTruthy();
    });

    it('can change', () => {
      function getPopupContainer(node) {
        return node.parentNode;
      }

      const wrapper = mount(
        <Trigger
          action={['click']}
          getPopupContainer={getPopupContainer}
          popupAlign={placementAlignMap.left}
          popup={<strong className="x-content">tooltip2</strong>}
        >
          <div className="target">click</div>
        </Trigger>,
        document.createElement('div'),
      );

      wrapper.trigger();
      const popupDomNode = wrapper.instance().getPopupDomNode();
      expect(
        popupDomNode.parentNode.parentNode.parentNode instanceof HTMLDivElement,
      ).toBeTruthy();
    });
  });

  describe('action', () => {
    it('click works', () => {
      const wrapper = mount(
        <Trigger
          action={['click']}
          popupAlign={placementAlignMap.left}
          popup={<strong className="x-content">tooltip2</strong>}
        >
          <div className="target">click</div>
        </Trigger>,
      );

      wrapper.trigger();
      expect(wrapper.find('Popup').find('.x-content').text()).toBe('tooltip2');

      wrapper.trigger();
      expect(wrapper.isHidden()).toBeTruthy();
    });

    it('click works with function', () => {
      const popup = function renderPopup() {
        return <strong className="x-content">tooltip3</strong>;
      };
      const wrapper = mount(
        <Trigger
          action={['click']}
          popupAlign={placementAlignMap.left}
          popup={popup}
        >
          <div className="target">click</div>
        </Trigger>,
      );

      wrapper.trigger();
      expect(wrapper.find('Popup').find('.x-content').text()).toBe('tooltip3');

      wrapper.trigger();
      expect(wrapper.isHidden()).toBeTruthy();
    });

    it('hover works', () => {
      const wrapper = mount(
        <Trigger
          action={['hover']}
          popupAlign={placementAlignMap.left}
          popup={<strong>trigger</strong>}
        >
          <div className="target">click</div>
        </Trigger>,
      );

      wrapper.trigger('mouseEnter');
      expect(wrapper.isHidden()).toBeFalsy();

      wrapper.trigger('mouseLeave');
      expect(wrapper.isHidden()).toBeTruthy();
    });

    it('contextMenu works', () => {
      const wrapper = mount(
        <Trigger
          action={['contextMenu']}
          popupAlign={placementAlignMap.left}
          popup={<strong>trigger</strong>}
        >
          <div className="target">contextMenu</div>
        </Trigger>,
      );

      wrapper.trigger('contextMenu');
      expect(wrapper.isHidden()).toBeFalsy();
    });

    describe('afterPopupVisibleChange can be triggered', () => {
      it('uncontrolled', () => {
        let triggered = 0;
        const wrapper = mount(
          <Trigger
            action={['click']}
            popupAlign={placementAlignMap.left}
            afterPopupVisibleChange={() => {
              triggered = 1;
            }}
            popup={<strong>trigger</strong>}
          >
            <div className="target">click</div>
          </Trigger>,
        );

        wrapper.trigger();
        expect(triggered).toBe(1);
      });

      it('controlled', () => {
        let triggered = 0;

        class Demo extends React.Component {
          state = {
            visible: false,
          };

          render() {
            return (
              <Trigger
                popupVisible={this.state.visible}
                popupAlign={placementAlignMap.left}
                afterPopupVisibleChange={() => {
                  triggered += 1;
                }}
                popup={<strong>trigger</strong>}
              >
                <div className="target">click</div>
              </Trigger>
            );
          }
        }

        const wrapper = mount(<Demo />);
        wrapper.setState({ visible: true });
        jest.runAllTimers();
        expect(triggered).toBe(1);

        wrapper.setState({ visible: false });
        jest.runAllTimers();
        expect(triggered).toBe(2);

        wrapper.unmount();
      });
    });

    it('nested action works', () => {
      class Test extends React.Component {
        clickTriggerRef = React.createRef();

        hoverTriggerRef = React.createRef();

        render() {
          return (
            <Trigger
              action={['click']}
              popupAlign={placementAlignMap.left}
              ref={this.clickTriggerRef}
              popup={<strong className="click-trigger">click trigger</strong>}
            >
              <Trigger
                action={['hover']}
                popupAlign={placementAlignMap.left}
                ref={this.hoverTriggerRef}
                popup={<strong className="hover-trigger">hover trigger</strong>}
              >
                <div className="target">trigger</div>
              </Trigger>
            </Trigger>
          );
        }
      }

      const wrapper = mount(<Test />);

      wrapper.find('.target').simulate('mouseEnter');
      wrapper.refresh();

      wrapper.find('.target').simulate('click');
      wrapper.refresh();

      const clickPopupDomNode = wrapper
        .instance()
        .clickTriggerRef.current.getPopupDomNode();
      const hoverPopupDomNode = wrapper
        .instance()
        .hoverTriggerRef.current.getPopupDomNode();
      expect(clickPopupDomNode).toBeTruthy();
      expect(hoverPopupDomNode).toBeTruthy();

      wrapper.find('.target').simulate('mouseLeave');
      wrapper.refresh();
      expect(hoverPopupDomNode.className.includes('-hidden')).toBeTruthy();
      expect(clickPopupDomNode.className.includes('-hidden')).toBeFalsy();

      wrapper.find('.target').simulate('click');
      wrapper.refresh();
      expect(hoverPopupDomNode.className.includes('-hidden')).toBeTruthy();
      expect(clickPopupDomNode.className.includes('-hidden')).toBeTruthy();
    });
  });

  // Placement & Align can not test in jsdom. This should test in `dom-align`

  describe('forceRender', () => {
    it("doesn't render at first time when forceRender=false", () => {
      const wrapper = mount(
        <Trigger popup={<span>Hello!</span>}>
          <span>Hey!</span>
        </Trigger>,
      );
      expect(wrapper.instance().getPopupDomNode()).toBeFalsy();
    });

    it('render at first time when forceRender=true', () => {
      class Test extends React.Component {
        triggerRef = React.createRef();

        render() {
          return (
            <Trigger
              ref={this.triggerRef}
              forceRender
              popup={<span>Hello!</span>}
            >
              <span>Hey!</span>
            </Trigger>
          );
        }
      }
      const wrapper = mount(<Test />);
      expect(
        wrapper.instance().triggerRef.current.getPopupDomNode(),
      ).toBeTruthy();
    });
  });

  describe('destroyPopupOnHide', () => {
    it('defaults to false', () => {
      const wrapper = mount(
        <Trigger
          action={['click']}
          popupAlign={placementAlignMap.topRight}
          popup={<strong>trigger</strong>}
        >
          <div className="target">click</div>
        </Trigger>,
      );

      wrapper.trigger();
      expect(wrapper.instance().getPopupDomNode()).toBeTruthy();
      wrapper.trigger();
      expect(wrapper.instance().getPopupDomNode()).toBeTruthy();
    });

    it('set true will destroy tooltip on hide', () => {
      const wrapper = mount(
        <Trigger
          action={['click']}
          destroyPopupOnHide
          popupAlign={placementAlignMap.topRight}
          popup={<strong>trigger</strong>}
        >
          <div className="target">click</div>
        </Trigger>,
      );

      wrapper.trigger();
      expect(wrapper.instance().getPopupDomNode()).toBeTruthy();
      wrapper.trigger();
      expect(wrapper.instance().getPopupDomNode()).toBeFalsy();
    });
  });

  describe('support autoDestroy', () => {
    it('defaults to false', () => {
      const wrapper = mount(
        <Trigger
          action={['click']}
          popupAlign={placementAlignMap.topRight}
          popup={<strong>trigger</strong>}
        >
          <div className="target">click</div>
        </Trigger>,
      );
      expect(wrapper.prop('autoDestroy')).toBeFalsy();
      wrapper.trigger();
      expect(wrapper.find(Portal).exists()).toBe(true);
      wrapper.trigger();
      expect(wrapper.find(Portal).exists()).toBe(true);
    });

    it('set true will destroy portal on hide', () => {
      const wrapper = mount(
        <Trigger
          action={['click']}
          autoDestroy
          popupAlign={placementAlignMap.topRight}
          popup={<strong>trigger</strong>}
        >
          <div className="target">click</div>
        </Trigger>,
      );

      wrapper.trigger();
      expect(wrapper.find(Portal).exists()).toBe(true);
      wrapper.trigger();
      expect(wrapper.find(Portal).exists()).toBe(false);
    });
  });

  describe('github issues', () => {
    // https://github.com/ant-design/ant-design/issues/9114
    it('click in popup of popup', () => {
      const builtinPlacements = {
        right: {
          points: ['cl', 'cr'],
        },
      };
      let innerVisible = null;
      function onInnerPopupVisibleChange(value) {
        innerVisible = value;
      }
      const innerTrigger = (
        <div style={{ background: 'rgba(255, 0, 0, 0.3)' }}>
          <Trigger
            onPopupVisibleChange={onInnerPopupVisibleChange}
            popupPlacement="right"
            action={['click']}
            builtinPlacements={builtinPlacements}
            popup={
              <div
                id="issue_9114_popup"
                style={{ background: 'rgba(0, 255, 0, 0.3)' }}
              >
                Final Popup
              </div>
            }
          >
            <div id="issue_9114_trigger">another trigger in popup</div>
          </Trigger>
        </div>
      );

      let visible = null;
      function onPopupVisibleChange(value) {
        visible = value;
      }
      const wrapper = mount(
        <Trigger
          onPopupVisibleChange={onPopupVisibleChange}
          popupPlacement="right"
          action={['click']}
          builtinPlacements={builtinPlacements}
          popup={innerTrigger}
        >
          <span style={{ margin: 20 }} className="target">
            basic trigger
          </span>
        </Trigger>,
      );

      // Basic click
      wrapper.find('.target').simulate('click');
      wrapper.refresh();
      expect(visible).toBeTruthy();
      expect(innerVisible).toBeFalsy();

      wrapper.find('#issue_9114_trigger').simulate('click');
      wrapper.refresh();
      expect(visible).toBeTruthy();
      expect(innerVisible).toBeTruthy();

      wrapper.find('#issue_9114_popup').simulate('click');
      wrapper.refresh();
      expect(visible).toBeTruthy();
      expect(innerVisible).toBeTruthy();
    });
  });

  describe('stretch', () => {
    const createTrigger = (stretch) =>
      mount(
        <Trigger
          action={['click']}
          popupAlign={placementAlignMap.left}
          popup={<strong className="x-content">tooltip2</strong>}
          stretch={stretch}
        >
          <div className="target">
            click me to show trigger
            <br />
            react component trigger
          </div>
        </Trigger>,
      );

    let domSpy;

    beforeAll(() => {
      domSpy = spyElementPrototypes(HTMLElement, {
        offsetWidth: {
          get: () => 1128,
        },
        offsetHeight: {
          get: () => 903,
        },
      });
    });

    afterAll(() => {
      domSpy.mockRestore();
    });

    ['width', 'height', 'minWidth', 'minHeight'].forEach((prop) => {
      it(prop, () => {
        const wrapper = createTrigger(prop);

        wrapper.trigger();

        expect(prop in wrapper.getPopupInner().props().style).toBeTruthy();
      });
    });
  });

  it('className should be undefined by default', () => {
    const wrapper = mount(
      <Trigger
        action={['click']}
        popupAlign={placementAlignMap.left}
        popup={<strong className="x-content">tooltip2</strong>}
      >
        <div>click</div>
      </Trigger>,
    );
    expect(wrapper.find('div').props().className).toBeFalsy();
  });

  it('support className', () => {
    const wrapper = mount(
      <Trigger
        action={['click']}
        popupAlign={placementAlignMap.left}
        popup={<strong className="x-content">tooltip2</strong>}
        className="className-in-trigger"
      >
        <div className="target">click</div>
      </Trigger>,
    );

    expect(wrapper.find('div').props().className).toBe(
      'target className-in-trigger',
    );
  });

  it('support className in nested Trigger', () => {
    const wrapper = mount(
      <Trigger
        action={['click']}
        popupAlign={placementAlignMap.left}
        popup={<strong className="x-content">tooltip2</strong>}
        className="className-in-trigger-2"
      >
        <Trigger
          action={['click']}
          popupAlign={placementAlignMap.left}
          popup={<strong className="x-content">tooltip2</strong>}
          className="className-in-trigger-1"
        >
          <div className="target">click</div>
        </Trigger>
      </Trigger>,
    );

    expect(wrapper.find('div').props().className).toBe(
      'target className-in-trigger-1 className-in-trigger-2',
    );
  });

  it('support function component', () => {
    const NoRef = React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => null);
      return (
        <div className="target" {...props}>
          click
        </div>
      );
    });

    const wrapper = mount(
      <Trigger
        action={['click']}
        popupAlign={placementAlignMap.left}
        popup={<strong className="x-content">tooltip2</strong>}
      >
        <NoRef />
      </Trigger>,
    );

    wrapper.trigger();
    expect(wrapper.isHidden()).toBeFalsy();

    wrapper.trigger();
    expect(wrapper.isHidden()).toBeTruthy();
  });

  it('Popup with mouseDown prevent', () => {
    const wrapper = mount(
      <Trigger
        action={['click']}
        popupAlign={placementAlignMap.left}
        popup={
          <div>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              Prevent
            </button>
          </div>
        }
      >
        <h1>233</h1>
      </Trigger>,
    );

    wrapper.trigger();
    expect(wrapper.isHidden()).toBeFalsy();

    wrapper
      .instance()
      .onDocumentClick({ target: wrapper.find('button').instance() });
    expect(wrapper.isHidden()).toBeFalsy();
  });

  // https://github.com/ant-design/ant-design/issues/21770
  it('support popupStyle, such as zIndex', () => {
    const style = { color: 'red', zIndex: 9999, top: 100 };
    const wrapper = mount(
      <Trigger
        popupVisible
        popupStyle={style}
        popup={<strong className="x-content">tooltip2</strong>}
      >
        <div className="target">click</div>
      </Trigger>,
    );

    const popupDomNode = wrapper.instance().getPopupDomNode();
    expect(popupDomNode.style.zIndex).toBe(style.zIndex.toString());
    expect(popupDomNode.style.color).toBe(style.color);
    expect(popupDomNode.style.top).toBe(`${style.top}px`);
  });

  describe('getContainer', () => {
    it('not trigger when dom not ready', () => {
      const getPopupContainer = jest.fn((node) => node.parentElement);

      function Demo() {
        return (
          <Trigger
            popupVisible
            getPopupContainer={getPopupContainer}
            popup={<strong className="x-content">tooltip2</strong>}
          >
            <div className="target">click</div>
          </Trigger>
        );
      }

      const wrapper = mount(<Demo />);

      expect(getPopupContainer).toHaveReturnedTimes(0);

      act(() => {
        jest.runAllTimers();
      });
      expect(getPopupContainer).toHaveReturnedTimes(1);
      expect(getPopupContainer).toHaveBeenCalledWith(
        wrapper.find('.target').instance(),
      );
    });

    it('not trigger when dom no need', () => {
      let triggerTimes = 0;
      const getPopupContainer = () => {
        triggerTimes += 1;
        return document.body;
      };

      function Demo() {
        return (
          <Trigger
            popupVisible
            getPopupContainer={getPopupContainer}
            popup={<strong className="x-content">tooltip2</strong>}
          >
            <div className="target">click</div>
          </Trigger>
        );
      }

      const wrapper = mount(<Demo />);

      expect(triggerTimes).toEqual(1);

      wrapper.unmount();
    });
  });

  // https://github.com/ant-design/ant-design/issues/30116
  it('createPortal should also work with stopPropagation', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);

    const div = document.createElement('div');
    document.body.appendChild(div);

    const OuterContent = ({ container }) => {
      return ReactDOM.createPortal(
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          Stop Pop
        </button>,
        container,
      );
    };

    const Demo = () => {
      return (
        <Trigger
          action={['click']}
          popup={
            <strong className="x-content">
              tooltip2
              <OuterContent container={div} />
            </strong>
          }
        >
          <div className="target">click</div>
        </Trigger>
      );
    };

    const wrapper = mount(<Demo />, { attachTo: root });

    wrapper.find('.target').simulate('click');
    expect(wrapper.isHidden()).toBeFalsy();

    // Click should not close
    wrapper.find('button').simulate('mouseDown');

    // Mock document mouse click event
    act(() => {
      const mouseEvent = new MouseEvent('mousedown');
      document.dispatchEvent(mouseEvent);
      wrapper.update();
    });

    wrapper.update();
    expect(wrapper.isHidden()).toBeFalsy();

    wrapper.unmount();

    document.body.removeChild(div);
    document.body.removeChild(root);
  });
});
