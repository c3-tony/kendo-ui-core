/**
 * @fileOverview Provides a TreeView implementation which can be used to display hierarchical data in a traditional
 * tree structure.
 */

(function($, undefined){
    /**
     * @name kendo.ui.TreeView.Description
     *
     * @section
     * <p>
     *  The <strong>TreeView</strong> displays hierarchical data in a traditional tree structure. It supports user
     *  interaction through the mouse or touch to perform re-ordering operations via drag-and-drop.
     * </p>
     * <p>
     *  A <strong>TreeView</strong> can be created by leveraging HTML lists. However, it does not support binding to a
     *  remote data source at this point in time.
     * </p>
     * <h3>Getting Started</h3>
     * <p>A <strong>TreeView</strong> can be created in two ways:</p>
     * <ol>
     *  <li>Define a hierarchical list with static HTML</li>
     *  <li>Use dynamic data binding</li>
     * </ol>
     * <p>
     *  Static HTML definition is appropriate for small hierarchies and for data that does not change frequently.
     *  Databinding should be used for larger data sets and for data that changes frequently.
     * </p>
     * <h3>Creating a TreeView from HTML</h3>
     *
     * @exampleTitle Create a hierarchical list in HTML
     * @example
     * <ul id="treeView">
     *     <li>Item 1
     *         <ul>
     *             <li>Item 1.1</li>
     *             <li>Item 1.2</li>
     *         </ul>
     *     </li>
     *     <li>Item 2</li>
     * </ul>
     *
     * @section
     * <p>
     *  Initialization of a <strong>TreeView</strong> should occur after the DOM is fully loaded. It is recommended
     *  that initialization the <strong>TreeView</strong> occur within a handler is provided to $(document).ready().
     * </p>
     *
     * @exampleTitle Initialize a TreeView using a selector within $(document).ready()
     * @example
     * $(document).ready(function() {
     *     $("#treeView").kendoTreeView();
     * });
     *
     * @section
     * <h3>Creating a TreeView with Data Binding to a Local Data Source</h3>
     *
     * @exampleTitle Create a hierarchical HTML list
     * @example
     * <div id="treeView"></div>
     *
     * @exampleTitle Initialize and bind the TreeView
     * @example
     * $(document).ready(function() {
     *     $("#treeView").kendoTreeView({
     *         dataSource: [
     *             {
     *                 text: "Item 1",
     *                 items: [
     *                     { text: "Item 1.1" },
     *                     { text: "Item 1.2" }
     *                 ]
     *             },
     *             { text: "Item 2" }
     *         ]
     *     })
     * });
     *
     * @section
     * <p>Currently, the <strong>TreeView</strong> does not support binding to a remote data source.</p>
     * @exampleTitle TreeView item JSON structure
     * @example
     * var item = {
     *     text: "Item text",
     *
     *     // renders a <img class="k-image" src="/images/icon.png" />
     *     imageUrl: "/images/icon.png",
     *
     *     // renders a <span class="k-sprite icon save" />
     *     spriteCssClass: "icon save",
     *
     *     // specifies whether the node text should be encoded or not
     *     // useful when rendering node-specific HTML
     *     encoded: false,
     *
     *     items: [
     *         // child items
     *     ]
     * }
     *
     * @section
     * <h3>Configuring TreeView Behavior</h3>
     * <p>
     *  A number of <strong>TreeView</strong> behaviors can be easily controlled by simple configuration properties,
     *  such as animation behaviors and drag-and-drop behaviors.
     * </p>
     *
     * @exampleTitle Enabling drag-and-drop for TreeView nodes
     * @example
     * $("#treeView").kendoTreeView({
     *     dragAndDrop: true
     * });
     *
     * @section
     * <p>
     *  When drag-and-drop is enabled, the nodes of a <strong>TreeView</strong> can be dragged and dropped between all
     *  levels, with useful tooltips helping indicate where the node will be dropped.
     * </p>
     * <h3>Accessing an Existing TreeView</h3>
     * <p>
     *  You can reference an existing <strong>TreeView</strong> instance via
     *  <a href="http://api.jquery.com/jQuery.data/">jQuery.data()</a>. Once a reference has been established, you can
     *  use the API to control its behavior.
     * </p>
     *
     * @exampleTitle Accessing an existing TreeView instance
     * @example
     * var treeView = $("#treeView").data("kendoTreeView");
     *
     */
    var kendo = window.kendo,
        ui = kendo.ui,
        extend = $.extend,
        template = kendo.template,
        Widget = ui.Widget,
        HierarchicalDataSource = kendo.data.HierarchicalDataSource,
        proxy = $.proxy,
        SELECT = "select",
        EXPAND = "expand",
        CHANGE = "change",
        COLLAPSE = "collapse",
        DRAGSTART = "dragstart",
        DRAG = "drag",
        DROP = "drop",
        DRAGEND = "dragend",
        CLICK = "click",
        VISIBILITY = "visibility",
        KSTATEHOVER = "k-state-hover",
        KTREEVIEW = "k-treeview",
        VISIBLE = ":visible",
        NODE = ".k-item",
        templates, rendering, TreeView,
        subGroup, nodeContents;

    function contentChild(filter) {
        return function(node) {
            var result = node.children(".k-animation-container");

            if (!result.length) {
                result = node;
            }

            return result.children(filter);
        };
    }

    subGroup = contentChild(".k-group");
    nodeContents = contentChild(".k-group,.k-content");

    function updateNodeHtml(node) {
        var wrapper = node.children("div"),
            group = node.children("ul"),
            toggleButton = wrapper.children(".k-icon"),
            innerWrapper = wrapper.children(".k-in"),
            currentNode, tmp;

        if (node.hasClass("k-treeview")) {
            return;
        }

        if (!wrapper.length) {
            wrapper = $("<div />").prependTo(node);
        }

        if (!toggleButton.length && group.length) {
            toggleButton = $("<span class='k-icon' />").prependTo(wrapper);
        } else if (!group.length || !group.children().length) {
            toggleButton.remove();
            group.remove();
        }

        if (!innerWrapper.length) {
            innerWrapper = $("<span class='k-in' />").appendTo(wrapper)[0];

            // move all non-group content in the k-in container
            currentNode = wrapper[0].nextSibling;
            innerWrapper = wrapper.find(".k-in")[0];

            while (currentNode && currentNode.nodeName.toLowerCase() != "ul") {
                tmp = currentNode;
                currentNode = currentNode.nextSibling;

                if (tmp.nodeType == 3) {
                    tmp.nodeValue = $.trim(tmp.nodeValue);
                }

                innerWrapper.appendChild(tmp);
            }
        }
    }

    function updateNodeClasses(node, groupData, nodeData) {
        var wrapper = node.children("div"),
            group = node.children("ul");

        if (node.hasClass("k-treeview")) {
            return;
        }

        if (!nodeData) {
            nodeData = {
                expanded: group.css("display") != "none",
                index: node.index(),
                enabled: !wrapper.children(".k-in").hasClass("k-state-disabled")
            };
        }

        if (!groupData) {
            groupData = {
                firstLevel: node.parent().parent().hasClass(KTREEVIEW),
                length: node.parent().children().length
            };
        }

        // li
        node.removeClass("k-first k-last")
            .addClass(rendering.wrapperCssClass(groupData, nodeData));

        // div
        wrapper.removeClass("k-top k-mid k-bot")
               .addClass(rendering.cssClass(groupData, nodeData));

        // toggle button
        if (group.length) {
            wrapper.children(".k-icon").removeClass("k-plus k-minus k-plus-disabled k-minus-disabled")
                .addClass(rendering.toggleButtonClass(nodeData));

            group.addClass("k-group");
        }
    }


    templates = {
        dragClue: template("<div class='k-header k-drag-clue'><span class='k-icon k-drag-status'></span>#= text #</div>"),
        group: template(
            "<ul class='#= r.groupCssClass(group) #'#= r.groupAttributes(group) #>" +
                "#= renderItems(data) #" +
            "</ul>"
        )
    };

    TreeView = Widget.extend(/** @lends kendo.ui.TreeView.prototype */ {
        /**
         *
         * Creates a TreeView instance.
         *
         * @constructs
         * @extends kendo.ui.Widget
         *
         * @param {Element} element DOM element
         * @param {Object} options Configuration options.
         *
         * @option {Array} [dataSource]
         * The data that the <strong>TreeView</strong> will be bound to.
         *
         * @option {Object} [animation]
         * A collection of visual animations used when items are expanded or collapsed through user interaction.
         * Setting this option to <strong>false</strong> will disable all animations.
         *
         * _example
         * $("#treeView").kendoTreeView({
         *     animation: {
         *         expand: {
         *             duration: 200,
         *             hide: true,
         *             show: false
         *         },
         *         collapse: {
         *             duration: 200,
         *             effects: "expandVertical",
         *             show: true
         *         }
         *     }
         * });
         *
         * @option {Animation} [animation.expand]
         * The animation that will be used when expanding items.
         *
         * @option {Number} [animation.expand.duration] <200> The number of milliseconds used for the animation when a
         * node is expanded.
         *
         * _example
         * $("#treeView").kendoTreeView({
         *     animation: {
         *         expand: {
         *             duration: 1000
         *         }
         *     }
         * });
         *
         * @option {String} [animation.expand.effects] <"expandVertical">
         * A whitespace-delimited string of animation effects that are utilized when a <strong>TreeView</strong> node
         * is expanded. Options include <strong>"expandVertical"</strong> and <strong>"fadeIn"</strong>.
         *
         * _exampleTitle Initialize a TreeView to expand and fade-in nodes over 5000 milliseconds
         * _example
         * $("#treeView").kendoTreeView({
         *     animation: {
         *         expand: {
         *             duration: 5000,
         *             effects: "expandVertical fadeIn"
         *         }
         *     }
         * });
         *
         * @option {Boolean} [animation.expand.show] <true>
         *
         * @option {Boolean} [dragAndDrop] <false>
         * Disables (<strong>false</strong>) or enables (<b>true</b>) drag-and-drop on the nodes of a
         * <strong>TreeView</strong>.
         *
         * @option {Animation} [animation.collapse]
         * The animation that will be used when collapsing items.
         *
         * @option {Number} [animation.collapse.duration] <200>
         * The number of milliseconds used for the animation when a node is expanded.
         *
         * _exampleTitle Initialize a TreeView to collapse nodes over 1000 milliseconds
         * _example
         * $("#treeView").kendoTreeView({
         *     animation: {
         *         collapse: {
         *             duration: 1000
         *         }
         *     }
         * });
         *
         * @option {String} [animation.collapse.effects]
         * A whitespace-delimited string of animation effects that are utilized when a <strong>TreeView</strong> node
         * is collapsed. Options include <strong>"fadeOut"</strong>.
         *
         * _exampleTitle Initialize a TreeView to collapse and fade-out nodes over 5000 milliseconds
         * _example
         * $("#treeView").kendoTreeView({
         *     animation: {
         *         collapse: {
         *             duration: 5000,
         *             effects: "fadeOut"
         *         }
         *     }
         * });
         *
         * @option {String|Function} [template] Template for rendering of the nodes of the treeview.
         * _example
         * $("#treeview").kendoTreeView({
         *     template: "#= item.text # <a href='\\#'>Delete</a>"
         * });
         *
         * @option {String|Function} [checkboxTemplate] Template for rendering of the treeview checkboxes.
         * _example
         * $("#treeview").kendoTreeView({
         *     template: kendo.template(
         *         "<input type='checkbox' name='checkedFiles[" +
         *             item.id +
         *         "]' value='true' />"
         *     )
         * });
         */
        init: function (element, options) {
            var that = this,
                clickableItems = ".k-in:not(.k-state-selected,.k-state-disabled)",
                MOUSEENTER = "mouseenter",
                dataInit,
                inferred = false;

            if ($.isArray(options)) {
                dataInit = true;
                options = { dataSource: options };
            }

            Widget.prototype.init.call(that, element, options);

            element = that.element;
            options = that.options;

            that._animation();

            that._dataSource();

            if (options.template && typeof options.template == "string") {
                options.template = template(options.template);
            } else if (!options.template) {
                options.template = that._textTemplate();
            }

            that.templates = {
                item: that._itemTemplate()
            };

            inferred = element.is("ul");

            // render treeview if it's not already rendered
            if (!element.hasClass(KTREEVIEW)) {
                that._wrapper();

                if (inferred) {
                    that.root = element;
                    that._group(that.wrapper);
                }
            } else {
                // otherwise just initialize properties
                that.wrapper = element;
                that.root = element.children("ul").eq(0);
            }

            that.wrapper
                .on(MOUSEENTER, ".k-in.k-state-selected", function(e) { e.preventDefault(); })
                .on(MOUSEENTER, clickableItems, function () { $(this).addClass(KSTATEHOVER); })
                .on("mouseleave", clickableItems, function () { $(this).removeClass(KSTATEHOVER); })
                .on(CLICK, clickableItems, proxy(that._nodeClick, that))
                .on("dblclick", "div:not(.k-state-disabled) .k-in", proxy(that._toggleButtonClick, that))
                .on(CLICK, ".k-plus,.k-minus", proxy(that._toggleButtonClick, that));

            if (options.dragAndDrop) {
                that.dragging = new TreeViewDragAndDrop(that);
            }

            if (!inferred) {
                that.dataSource.read();
            }
        },

        _animation: function() {
            var options = this.options;

            if (options.animation === false) {
                options.animation = {
                    expand: { show: true, effects: {} },
                    collapse: { hide: true, effects: {} }
                };
            }
        },

        _dataSource: function() {
            var that = this,
                options = that.options,
                dataSource = options.dataSource;

            dataSource = { data: dataSource };
            //dataSource = isArray(dataSource) ? { data: dataSource } : dataSource;

            if (that.dataSource && that._refreshHandler) {
                that.dataSource.unbind(CHANGE, that._refreshHandler);
                                //.unbind(REQUESTSTART, that._requestStartHandler)
                                //.unbind(ERROR, that._errorHandler);
            } else {
                that._refreshHandler = proxy(that.refresh, that);
                //that._requestStartHandler = proxy(that._requestStart, that);
                //that._errorHandler = proxy(that._error, that);
            }

            that.dataSource = new HierarchicalDataSource(dataSource)
                                .bind(CHANGE, that._refreshHandler);
                                //.bind(REQUESTSTART, that._requestStartHandler)
                                //.bind(ERROR, that._errorHandler);
        },

        refresh: function(e) {
            var that = this,
                parentNode = that.element;

            if (e.action == "add") {
                if (e.node) {
                    // adding to subgroup
                    parentNode = that.element.find(".k-item[" + kendo.attr("uid") + "=" + e.node.uid + "]");
                }

                that.append(e.items, parentNode);
            } else if (e.action == "remove") {
            } else {
                // TODO: handle loading of subgroups
                that.root = that.wrapper.html(that._renderGroup({
                    items: e.items,
                    group: {
                        firstLevel: true,
                        expanded: true
                    }
                })).children("ul");
            }
        },

        events: [
            /**
            *
            * Triggered before the dragging of a node starts.
            *
            * @name kendo.ui.TreeView#dragstart
            * @event
            *
            * @param {Event} e
            *
            * @param {Node} e.sourceNode
            * The node that will be dragged.
            *
            * @exampleTitle Disable dragging of root nodes
            * @example
            * treeview.data("kendoTreeView").bind("dragstart", function(e) {
            *     if ($(e.sourceNode).parentsUntil(".k-treeview", ".k-item").length == 0) {
            *         e.preventDefault();
            *     }
            * });
            *
            */
            DRAGSTART,

            /**
            *
            * Triggered while a node is being dragged.
            *
            * @name kendo.ui.TreeView#drag
            * @event
            *
            * @param {Event} e
            *
            * @param {Node} e.sourceNode
            * The node that is being dragged.
            *
            * @param {Element} e.dropTarget
            * The element that the node is placed over.
            *
            * @param {Number} e.pageX
            * The x coordinate of the mouse.
            *
            * @param {Number} e.pageY
            * The y coordinate of the mouse.
            *
            * @param {String} e.statusClass
            * The status that the drag clue shows.
            *
            * @param {Function} e.setStatusClass
            * Allows a custom drag clue status to be set.
            * <p>Pre-defined status classes are:</p>
            * <ul>
            *     <li><strong>k-insert-top</strong>
            *         - Indicates that the item will be inserted on top.
            *     </li>
            *     <li><strong>k-insert-middle</strong>
            *         - Indicates that the item will be inserted in the middle.
            *     </li>
            *     <li><strong>k-insert-bottom</strong>
            *         - Indicates that the item will be inserted at the bottom.
            *     </li>
            *     <li><strong>k-add</strong>
            *         - Indicates that the item will be added/appended.
            *     </li>
            *     <li><strong>k-denied</strong>
            *         - Indicates an invalid operation. Using this class will automatically
            *           make the drop operation invalid, so there will be no need to call
            *           <code>setValid(false)</code> in the <code>drop</code> event.
            *     </li>
            * </ul>
            *
            * @exampleTitle Show the user that is not permitted to drop nodes outside of the #drop-area element
            * @example
            * treeview.data("kendoTreeView").bind("drag", function(e) {
            *     if ($(e.dropTarget).parents("#drop-area").length ) {
            *         e.setStatusClass("k-denied");
            *     }
            * });
            *
            */
            DRAG,

            /**
            *
            * Triggered when a node is being dropped.
            *
            * @name kendo.ui.TreeView#drop
            * @event
            *
            * @param {Event} e
            *
            * @param {Node} e.sourceNode
            * The node that is being dropped.
            *
            * @param {Node} e.destinationNode
            * The node that the sourceNode is being dropped upon.
            *
            * @param {Boolean} e.valid
            * Whether this drop operation is permitted.
            *
            * @param {Function} e.setValid
            * Allows the drop to be prevented.
            *
            * @param {Element} e.dropTarget
            * The element that the node is placed over.
            *
            * @param {String} e.dropPosition
            * Shows where the source will be dropped. One of the values <strong>over</strong>, <strong>before</strong>, or <strong>after</strong>.
            *
            */
            DROP,

            /**
            *
            * Triggered after a node has been dropped.
            *
            * @name kendo.ui.TreeView#dragend
            * @event
            *
            * @param {Event} e
            *
            * @param {Node} e.sourceNode
            * The node that is being dropped.
            *
            * @param {Node} e.destinationNode
            * The node that the sourceNode is being dropped upon.
            *
            * @param {String} e.dropPosition
            * Shows where the source has been dropped. One of the values <strong>over</strong>, <strong>before</strong>, or <strong>after</strong>.
            *
            */
            DRAGEND,
            /**
            *
            * Triggered before a subgroup gets expanded.
            *
            * @name kendo.ui.TreeView#expand
            * @event
            *
            * @param {Event} e
            *
            * @param {Node} e.node
            * The expanded node
            *
            */
            EXPAND,

            /**
            *
            * Triggered before a subgroup gets collapsed.
            *
            * @name kendo.ui.TreeView#collapse
            * @event
            *
            * @param {Event} e
            *
            * @param {Node} e.node
            * The collapsed node
            *
            */
            COLLAPSE,

            /**
            *
            * Triggered when a node gets selected.
            *
            * @name kendo.ui.TreeView#select
            * @event
            *
            * @param {Event} e
            *
            * @param {Node} e.node
            * The selected node
            *
            */
            SELECT
        ],

        options: {
            name: "TreeView",
            dataSource: {},
            animation: {
                expand: {
                    effects: "expand:vertical",
                    duration: 200,
                    show: true
                }, collapse: {
                    duration: 100
                }
            },
            dragAndDrop: false
        },

        _textTemplate: function() {
            var bindings = this.options.bindings || {},
                field = function(fieldName) {
                    return "item['" + (bindings[fieldName] || fieldName) + "']";
                },
                templateText =
                    "# if (typeof item.encoded != 'undefined' && item.encoded === false) {#" +
                        "#=" + field("text") + "#" +
                    "# } else { #" +
                        "#:" + field("text") + "#" +
                    "# } #";

            return template(templateText);
        },

        _itemTemplate: function() {
            var bindings = this.options.bindings || {},
                field = function(fieldName) {
                    return "item['" + (bindings[fieldName] || fieldName) + "']";
                },
                templateText =
                    "<li class='#= r.wrapperCssClass(group, item) #'" +
                        " " + kendo.attr("uid") + "='#= item.uid #'" +
                    ">" +
                        "<div class='#= r.cssClass(group, item) #'>" +
                            "# if (" + field("items") + ") { #" +
                                "<span class='#= r.toggleButtonClass(item) #'></span>" +
                            "# } #" +

                            "# if (treeview.checkboxTemplate) { #" +
                                "<span class='k-checkbox'>" +
                                    "#= treeview.checkboxTemplate(data) #" +
                                "</span>" +
                            "# } #" +

                            "# var tag = " + field("url") + " ? 'a' : 'span'; #" +
                            "# var textAttr = " + field("url") +
                                    " ? ' href=\\''+" + field("url") + "+'\\'' : ''; #" +

                            "<#=tag# class='#= r.textClass(item) #'#= textAttr #>" +

                                "# if (" + field("imageUrl") + ") { #" +
                                    "<img class='k-image' alt='' src='#=" + field("imageUrl") + "#'>" +
                                "# } #" +

                                "# if (" + field("spriteCssClass") + ") { #" +
                                    "<span class='k-sprite #=" + field("spriteCssClass") + "#'></span>" +
                                "# } #" +

                                "#= treeview.template(data) #" +
                            "</#=tag#>" +
                        "</div>" +

                        "# if (" + field("items") + ") { #" +
                            "#= subGroup(group, item) #" +
                        "# } #" +
                    "</li>";

            return template(templateText);
        },

        setOptions: function(options) {
            var that = this;

            if (("dragAndDrop" in options) && options.dragAndDrop && !that.options.dragAndDrop) {
                that.dragging = new TreeViewDragAndDrop(that);
            }

            Widget.fn.setOptions.call(that, options);

            that._animation();
        },

        _trigger: function (eventName, node) {
            return this.trigger(eventName, {
                node: node.closest(NODE)[0]
            });
        },

        _toggleButtonClick: function (e) {
            this.toggle($(e.target).closest(NODE));
        },

        _nodeClick: function (e) {
            var that = this,
                node = $(e.target),
                contents = nodeContents(node.closest(NODE)),
                href = node.attr("href"),
                shouldNavigate;

            if (href) {
                shouldNavigate = href == "#" || href.indexOf("#" + this.element.id + "-") >= 0;
            } else {
                shouldNavigate = contents.length && !contents.children().length;
            }

            if (shouldNavigate) {
                e.preventDefault();
            }

            if (!node.hasClass(".k-state-selected") && !that._trigger("select", node)) {
                that.select(node);
            }
        },

        _wrapper: function() {
            var that = this,
                element = that.element,
                wrapper, root,
                wrapperClasses = "k-widget k-treeview k-reset";

            if (element.is("div")) {
                wrapper = element;
                root = wrapper.children("ul").eq(0);
            } else { // element is ul
                wrapper = element.wrap('<div />').parent();
                root = element;
            }

            that.wrapper = wrapper.addClass(wrapperClasses);
            that.root = root;
        },

        _group: function(item) {
            var that = this,
                firstLevel = item.hasClass(KTREEVIEW),
                group = {
                    firstLevel: firstLevel,
                    expanded: firstLevel || item.attr(kendo.attr("expanded")) === "true"
                },
                groupElement = item.children("ul");

            groupElement
                .addClass(rendering.groupCssClass(group))
                .css("display", group.expanded ? "" : "none");

            that._nodes(groupElement, group);
        },

        _nodes: function(groupElement, groupData) {
            var that = this,
                nodes = groupElement.children("li"),
                nodeData;

            groupData = extend({ length: nodes.length }, groupData);

            nodes.each(function(i, node) {
                node = $(node);

                nodeData = { index: i, expanded: node.attr(kendo.attr("expanded")) === "true" };

                updateNodeHtml(node);

                updateNodeClasses(node, groupData, nodeData);

                // iterate over child nodes
                that._group(node);
            });
        },

        _processNodes: function(nodes, callback) {
            var that = this;
            that.element.find(nodes).each(function(index, item) {
                callback.call(that, index, $(item).closest(NODE));
            });
        },

        /**
         *
         * Expands nodes.
         *
         * @param {Selector} nodes
         * The nodes that are to be expanded.
         *
         * @example
         * var treeview = $("#treeview").data("kendoTreeView");
         *
         * // expands the node with id="firstItem"
         * treeview.expand(document.getElementById("firstItem"));
         *
         * // expands all nodes
         * treeview.expand(".k-item");
         *
         */
        expand: function (nodes) {
            this._processNodes(nodes, function (index, item) {
                var contents = nodeContents(item);

                if (contents.length > 0 && !contents.is(VISIBLE)) {
                    this.toggle(item);
                }
            });
        },

        /**
         *
         * Collapses nodes.
         *
         * @param {Selector} nodes
         * The nodes that are to be collapsed.
         *
         * @example
         * var treeview = $("#treeview").data("kendoTreeView");
         *
         * // collapse the node with id="firstItem"
         * treeview.collapse(document.getElementById("firstItem"));
         *
         * // collapse all nodes
         * treeview.collapse(".k-item");
         *
         */
        collapse: function (nodes) {
            this._processNodes(nodes, function (index, item) {
                var contents = nodeContents(item);

                if (contents.length > 0 && contents.is(VISIBLE)) {
                    this.toggle(item);
                }
            });
        },

        /**
         *
         * Enables or disables nodes.
         *
         * @param {Selector} nodes
         * The nodes that are to be enabled/disabled.
         *
         * @param {Boolean} [enable=true]
         * Whether the nodes should be enabled or disabled.
         *
         * @example
         * var treeview = $("#treeview").data("kendoTreeView");
         *
         * // disable the node with id="firstItem"
         * treeview.enable(document.getElementById("firstItem"), false);
         *
         * // enable all nodes
         * treeview.enable(".k-item");
         *
         */
        enable: function (nodes, enable) {
            enable = arguments.length == 2 ? !!enable : true;

            this._processNodes(nodes, function (index, item) {
                var isCollapsed = !nodeContents(item).is(VISIBLE);

                if (!enable) {
                    this.collapse(item);
                    isCollapsed = true;
                }

                item.children("div")
                        .children(".k-in")
                            .toggleClass("k-state-default", enable)
                            .toggleClass("k-state-disabled", !enable)
                        .end()
                        .children(".k-icon")
                            .toggleClass("k-plus", isCollapsed && enable)
                            .toggleClass("k-plus-disabled", isCollapsed && !enable)
                            .toggleClass("k-minus", !isCollapsed && enable)
                            .toggleClass("k-minus-disabled", !isCollapsed && !enable);
            });
        },

        /**
         *
         * Gets or sets the selected node of a TreeView.
         *
         * @param {Selector} [node]
         * If provided, the node of a TreeView that should be selected.
         *
         * @returns {Node}
         * The selected node of a TreeView.
         *
         * @exampleTitle Select the node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * treeView.select($("#firstItem"));
         *
         * @exampleTitle Get the currently selected node
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * var selectedNode = treeView.select();
         *
         */
        select: function (node) {
            var element = this.element;

            if (!arguments.length) {
                return element.find(".k-state-selected").closest(NODE);
            }

            node = $(node, element).closest(NODE);

            if (node.length) {
                element.find(".k-in").removeClass("k-state-hover k-state-selected");

                node.find(".k-in:first").addClass("k-state-selected");
            }
        },

        /**
         *
         * Toggles the node of a TreeView between its expanded and collapsed states.
         *
         * @param {Selector} node
         * The node that should be toggled.
         *
         * @exampleTitle Toggle the state of a node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * treeView.toggle($("#firstItem"));
         *
         */
        toggle: function (node) {
            node = $(node);

            if (!node.find(".k-minus,.k-plus").length) {
                return;
            }

            if (node.find("> div > .k-state-disabled").length) {
                return;
            }

            var that = this,
                contents = nodeContents(node),
                isExpanding = !contents.is(VISIBLE),
                animationSettings = that.options.animation || {},
                animation = animationSettings.expand,
                collapse = extend({}, animationSettings.collapse),
                hasCollapseAnimation = collapse && "effects" in collapse;

            if (contents.data("animating")) {
                return;
            }

            if (!isExpanding) {
                animation = extend( hasCollapseAnimation ? collapse
                                    : extend({ reverse: true }, animation), { show: false, hide: true });
            }

            if (contents.children().length > 0) {
                if (!that._trigger(isExpanding ? "expand" : "collapse", node)) {
                    node.find("> div > .k-icon")
                        .toggleClass("k-minus", isExpanding)
                        .toggleClass("k-plus", !isExpanding);

                    if (!isExpanding) {
                        contents.css("height", contents.height()).css("height");
                    }

                    contents.kendoStop(true, true).kendoAnimate(extend(animation, {
                        complete: function() {
                            if (isExpanding) {
                                contents.css("height", "");
                            }
                        }
                    }));
                }
            }
        },

        /**
         *
         * Gets the text of a node in a TreeView.
         *
         * @param {Selector} node
         * The node of which the text is being retrieved.
         *
         * @returns {String}
         * The text of a node.
         *
         * @exampleTitle Get the text of the node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * var nodeText = treeView.text($("#firstItem"));
         *
         */
        text: function (node) {
            return $(node).closest(NODE).find(">div>.k-in").text();
        },

        _insertNode: function(nodeData, index, parentNode, group, insertCallback) {
            var that = this,
                updatedGroupLength = group.children().length + 1,
                isArrayData, fromNodeData,
                groupData = {
                    firstLevel: parentNode.hasClass(KTREEVIEW),
                    expanded: true,
                    length: updatedGroupLength
                }, node, i, nodeHtml = "";

            function toNodeHtml(nodeData, index) {
                return that._renderItem({
                    group: groupData,
                    item: extend(nodeData, { index: index })
                });
            }

            if (nodeData.toJSON) {
                nodeData = nodeData.toJSON();
            }

            isArrayData = $.isArray(nodeData);
            fromNodeData = isArrayData || $.isPlainObject(nodeData);

            if (fromNodeData) {
                if (isArrayData) {
                    for (i = 0; i < nodeData.length; i++) {
                        nodeHtml += toNodeHtml(nodeData[i], index + i);
                    }

                } else {
                    nodeHtml = toNodeHtml(nodeData, index);
                }

                node = $(nodeHtml);
            } else {
                node = $(nodeData);

                if (group.children()[index - 1] == node[0]) {
                    return node;
                }

                if (node.closest(".k-treeview")[0] == that.wrapper[0]) {
                    that.detach(node);
                }
            }

            if (!group.length) {
                group = $(that._renderGroup({
                    group: groupData
                })).appendTo(parentNode);
            }

            insertCallback(node, group);

            if (parentNode.hasClass("k-item")) {
                updateNodeHtml(parentNode);
                updateNodeClasses(parentNode);
            }

            if (!fromNodeData) {
                updateNodeClasses(node);
            }

            updateNodeClasses(node.prev());
            updateNodeClasses(node.next());

            return node;
        },

        /**
         *
         * Inserts a node after a specified node in a TreeView. This method may also be used to reorder the nodes of a
         * TreeView.
         *
         * @param {String|Selector} nodeData
         * A JSON-formatted string or selector that specifies the node to be inserted.
         *
         * @param {Node} referenceNode
         * The node that will be preceed the newly-appended node.
         *
         * @exampleTitle Insert a node with the text, "Y U NO insert node?" after the node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * treeView.insertAfter({ text: "Y U NO insert node?" }, $("#firstItem"));
         *
         * @exampleTitle Moves a node with ID, secondNode after a node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * treeView.insertAfter($("#secondNode"), $("#firstItem"));
         *
         */
        insertAfter: function (nodeData, referenceNode) {
            var group = referenceNode.parent();

            return this._insertNode(nodeData, referenceNode.index() + 1, group.parent(), group, function(item, group) {
                item.insertAfter(referenceNode);
            });
        },

        /**
         *
         * Inserts a node before another node. This method may also be used to reorder the nodes of a
         * TreeView.
         *
         * @param {String|Selector} nodeData
         * A JSON-formatted string or selector that specifies the node to be inserted.
         *
         * @param {Node} referenceNode
         * The node that follows the inserted node.
         *
         * @exampleTitle Inserts a new node with the text, "It's over 9000!" before the node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * treeView.insertBefore({ text: "It's over 9000!" }, $("#firstItem"));
         *
         * @exampleTitle Moves the node with ID, secondNode before the node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * treeView.insertBefore($("#secondNode"), $("#firstItem"));
         *
         */
        insertBefore: function (nodeData, referenceNode) {
            var group = referenceNode.parent();

            return this._insertNode(nodeData, referenceNode.index(), group.parent(), group, function(item, group) {
                item.insertBefore(referenceNode);
            });
        },

        /**
         *
         * Appends a node to a group of a TreeView. This method may also be used to reorder the nodes of a
         * TreeView.
         *
         * @param {String|Selector} nodeData
         * A JSON-formatted string or selector that specifies the node to be appended.
         *
         * @param {Node} [parentNode]
         * The node that will contain the newly appended node. If not specified, the new node will be appended to the
         * root group of the TreeView.
         *
         * @exampleTitle Append a new node with the text, "Meanwhile, in HTML5..." to the node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * treeView.append({ text: "Meanwhile, in HTML5..." }, $("#firstItem"));
         *
         * @exampleTitle Moves the node with ID, secondNode as a last child of the node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * treeView.append($("#secondNode"), $("#firstItem"));
         *
         */
        append: function (nodeData, parentNode) {
            parentNode = parentNode || this.element;

            var group = subGroup(parentNode);

            return this._insertNode(nodeData, group.children().length, parentNode, group, function(item, group) {
                item.appendTo(group);
            });
        },

        _remove: function (node, keepData) {
            var parentNode,
                prevSibling, nextSibling;

            node = $(node, this.element);

            parentNode = node.parent().parent();
            prevSibling = node.prev();
            nextSibling = node.next();

            node[keepData ? "detach" : "remove"]();

            if (parentNode.hasClass("k-item")) {
                updateNodeHtml(parentNode);
                updateNodeClasses(parentNode);
            }

            updateNodeClasses(prevSibling);
            updateNodeClasses(nextSibling);

            return node;
        },

        /**
         *
         * Removes a node from a TreeView.
         *
         * @param {Selector} node
         * The node that is to be removed.
         *
         * @exampleTitle Remove the node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * treeView.remove($("#firstItem"));
         *
         */
        remove: function (node) {
            return this._remove(node, false);
        },

        /**
         *
         * Removes a node from a TreeView, but keeps its jQuery.data() objects.
         *
         * @param {Selector} node
         * The node that is to be detached.
         *
         * @returns {jQuery}
         * The node that has been detached.
         *
         * @exampleTitle Remove the node with ID, firstItem
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * var firstItem = $("#firstItem");
         * firstItem.data("id", 1);
         * treeview.detach(firstItem);
         * firstItem.data("id") == 1;
         *
         */
        detach: function (node) {
            return this._remove(node, true);
        },

        /**
         *
         * Searches a TreeView for a node that has specific text.
         *
         * @param {String} text
         * The text that is being searched for.
         *
         * @returns {jQuery}
         * All nodes that have the text.
         *
         * @exampleTitle Search a TreeView for the item that has the text, "CSS3 is da bomb!"
         * @example
         * var treeView = $("#treeView").data("kendoTreeView");
         * var foundNode = treeView.findByText("CSS3 is da bomb!");
         *
         */
        findByText: function(text) {
            return $(this.element).find(".k-in").filter(function(i, element) {
                return $(element).text() == text;
            }).closest(NODE);
        },

        _renderItem: function (options) {
            var that = this,
                bindings = that.options.bindings || {};

            if (!options.group) {
                options.group = {};
            }

            options.treeview = that.options;
            options.subGroup = function(group, item) {
                    return that._renderGroup({
                        items: item[bindings.items || "items"],
                        group: {
                           expanded: item.expanded
                        }
                    });
                };

            options.r = rendering;

            return that.templates.item(options);
        },

        _renderGroup: function (options) {
            var that = this;

            options.renderItems = function(options) {
                    var html = "",
                        i = 0,
                        items = options.items,
                        len = items ? items.length : 0,
                        group = options.group;

                    group.length = len;

                    for (; i < len; i++) {
                        options.group = group;
                        options.item = items[i];
                        options.item.index = i;
                        html += that._renderItem(options);
                    }

                    return html;
                };

            options.r = rendering;

            return templates.group(options);
        }
    });

    function TreeViewDragAndDrop(treeview) {
        var that = this;

        that.treeview = treeview;

        that._draggable = new ui.Draggable(treeview.element, {
           filter: "div:not(.k-state-disabled) .k-in",
           hint: function(node) {
               return templates.dragClue({ text: node.text() });
           },
           cursorOffset: {
               left: 10,
               top: kendo.support.touch ? -40 / kendo.support.zoomLevel() : 10
           },
           dragstart: proxy(that.dragstart, that),
           dragcancel: proxy(that.dragcancel, that),
           drag: proxy(that.drag, that),
           dragend: proxy(that.dragend, that)
        });
    }

    TreeViewDragAndDrop.prototype = /** @ignore */{
        _hintStatus: function(newStatus) {
            var statusElement = this._draggable.hint.find(".k-drag-status")[0];

            if (newStatus) {
                statusElement.className = "k-icon k-drag-status " + newStatus;
            } else {
                return $.trim(statusElement.className.replace(/k-(icon|drag-status)/g, ""));
            }
        },

        dragstart: function (e) {
            var that = this,
                treeview = that.treeview,
                sourceNode = that.sourceNode = e.currentTarget.closest(NODE);

            if (treeview.trigger(DRAGSTART, { sourceNode: sourceNode[0] })) {
                e.preventDefault();
            }

            that.dropHint = $("<div class='k-drop-hint' />")
                .css(VISIBILITY, "hidden")
                .appendTo(treeview.element);
        },

        drag: function (e) {
            var that = this,
                treeview = that.treeview,
                sourceNode = that.sourceNode,
                dropTarget = that.dropTarget = $(kendo.eventTarget(e)),
                statusClass,
                hoveredItem, hoveredItemPos, itemHeight, itemTop, itemContent, delta,
                insertOnTop, insertOnBottom, addChild;

            if (!dropTarget.closest(".k-treeview").length) {
                // dragging node outside of treeview
                statusClass = "k-denied";
            } else if ($.contains(sourceNode[0], dropTarget[0])) {
                // dragging node within itself
                statusClass = "k-denied";
            } else {
                // moving or reordering node
                statusClass = "k-insert-middle";

                that.dropHint.css(VISIBILITY, "visible");

                hoveredItem = dropTarget.closest(".k-top,.k-mid,.k-bot");

                if (hoveredItem.length > 0) {
                    itemHeight = hoveredItem.outerHeight();
                    itemTop = hoveredItem.offset().top;
                    itemContent = dropTarget.closest(".k-in");
                    delta = itemHeight / (itemContent.length > 0 ? 4 : 2);

                    insertOnTop = e.pageY < (itemTop + delta);
                    insertOnBottom = (itemTop + itemHeight - delta) < e.pageY;
                    addChild = itemContent.length > 0 && !insertOnTop && !insertOnBottom;

                    itemContent.toggleClass(KSTATEHOVER, addChild);
                    that.dropHint.css(VISIBILITY, addChild ? "hidden" : "visible");

                    if (addChild) {
                        statusClass = "k-add";
                    } else {
                        hoveredItemPos = hoveredItem.position();
                        hoveredItemPos.top += insertOnTop ? 0 : itemHeight;

                        that.dropHint
                            .css(hoveredItemPos)
                            [insertOnTop ? "prependTo" : "appendTo"](dropTarget.closest(NODE).children("div:first"));

                        if (insertOnTop && hoveredItem.hasClass("k-top")) {
                            statusClass = "k-insert-top";
                        }

                        if (insertOnBottom && hoveredItem.hasClass("k-bot")) {
                            statusClass = "k-insert-bottom";
                        }
                    }
                } else if (dropTarget[0] != that.dropHint[0]) {
                    statusClass = "k-denied";
                }
            }

            treeview.trigger(DRAG, {
                sourceNode: sourceNode[0],
                dropTarget: dropTarget[0],
                pageY: e.pageY,
                pageX: e.pageX,
                statusClass: statusClass.substring(2),
                setStatusClass: function (value) {
                    statusClass = value;
                }
            });

            if (statusClass.indexOf("k-insert") !== 0) {
                that.dropHint.css(VISIBILITY, "hidden");
            }

            that._hintStatus(statusClass);
        },

        dragcancel: function(e) {
            this.dropHint.remove();
            //treeview.trigger("nodeDragCancelled", { item: sourceNode[0] });
        },

        dragend: function (e) {
            var that = this,
            treeview = that.treeview,
            dropPosition = "over",
            sourceNode = that.sourceNode,
            destinationNode,
            dropHint = that.dropHint,
            valid, dropPrevented;

            if (dropHint.css(VISIBILITY) == "visible") {
                dropPosition = dropHint.prevAll(".k-in").length > 0 ? "after" : "before";
                destinationNode = dropHint.closest(NODE);
            } else if (that.dropTarget) {
                destinationNode = that.dropTarget.closest(NODE);
            }

            valid = that._hintStatus() != "k-denied";

            dropPrevented = treeview.trigger(DROP, {
                sourceNode: sourceNode[0],
                destinationNode: destinationNode[0],
                valid: valid,
                setValid: function(newValid) { valid = newValid; },
                dropTarget: e.target,
                dropPosition: dropPosition
            });

            dropHint.remove();

            if (!valid || dropPrevented) {
                that._draggable.dropped = valid;
                return;
            }

            that._draggable.dropped = true;

            // perform reorder / move
            if (dropPosition == "over") {
                treeview.append(sourceNode, destinationNode);
                treeview.expand(destinationNode);
            } else if (dropPosition == "before") {
                treeview.insertBefore(sourceNode, destinationNode);
            } else if (dropPosition == "after") {
                treeview.insertAfter(sourceNode, destinationNode);
            }

            treeview.trigger(DRAGEND, {
                sourceNode: sourceNode[0],
                destinationNode: destinationNode[0],
                dropPosition: dropPosition
            });
        }
    };

    // client-side rendering

    rendering = /** @ignore */{
        wrapperCssClass: function (group, item) {
            var result = "k-item",
                index = item.index;

            if (group.firstLevel && index === 0) {
                result += " k-first";
            }

            if (index == group.length-1) {
                result += " k-last";
            }

            return result;
        },
        cssClass: function(group, item) {
            var result = "",
                index = item.index,
                groupLength = group.length - 1;

            if (group.firstLevel && index === 0) {
                result += "k-top ";
            }

            if (index === 0 && index != groupLength) {
                result += "k-top";
            } else if (index == groupLength) {
                result += "k-bot";
            } else {
                result += "k-mid";
            }

            return result;
        },
        textClass: function(item) {
            var result = "k-in";

            if (item.enabled === false) {
                result += " k-state-disabled";
            }

            if (item.selected === true) {
                result += " k-state-selected";
            }

            return result;
        },
        toggleButtonClass: function(item) {
            var result = "k-icon";

            if (item.expanded !== true) {
                result += " k-plus";
            } else {
                result += " k-minus";
            }

            if (item.enabled === false) {
                result += "-disabled";
            }

            return result;
        },
        groupAttributes: function(group) {
            return group.expanded !== true ? " style='display:none'" : "";
        },
        groupCssClass: function(group) {
            var cssClass = "k-group";

            if (group.firstLevel) {
                cssClass += " k-treeview-lines";
            }

            return cssClass;
        }
    };

    ui.plugin(TreeView);
})(jQuery);
