using Kendo.Mvc.Extensions;
using Microsoft.AspNet.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Kendo.Mvc.UI
{
    /// <summary>
    /// Kendo UI AutoComplete component
    /// </summary>
    public partial class AutoComplete 
    {
        public string DataTextField { get; set; }

        public double? Delay { get; set; }

        public bool? Enable { get; set; }

        public string Filter { get; set; }

        public string FixedGroupTemplate { get; set; }

        public string FixedGroupTemplateId { get; set; }

        public string GroupTemplate { get; set; }

        public string GroupTemplateId { get; set; }

        public double? Height { get; set; }

        public bool? HighlightFirst { get; set; }

        public bool? IgnoreCase { get; set; }

        public double? MinLength { get; set; }

        public string Placeholder { get; set; }

        public string Separator { get; set; }

        public bool? Suggest { get; set; }

        public string HeaderTemplate { get; set; }

        public string HeaderTemplateId { get; set; }

        public string Template { get; set; }

        public string TemplateId { get; set; }

        public bool? ValuePrimitive { get; set; }

        public AutoCompleteVirtualSettings Virtual { get; } = new AutoCompleteVirtualSettings();


        protected override Dictionary<string, object> SerializeSettings()
        {
            var settings = base.SerializeSettings();

            if (DataTextField?.HasValue() == true)
            {
                settings["dataTextField"] = DataTextField;
            }

            if (Delay.HasValue)
            {
                settings["delay"] = Delay;
            }

            if (Enable.HasValue)
            {
                settings["enable"] = Enable;
            }

            if (Filter?.HasValue() == true)
            {
                settings["filter"] = Filter;
            }

            if (FixedGroupTemplateId.HasValue())
            {
                settings["fixedGroupTemplate"] = new ClientHandlerDescriptor {
                    HandlerName = string.Format(
                        "jQuery('{0}{1}').html()", IdPrefix, FixedGroupTemplateId
                    )
                };
            }
            else if (FixedGroupTemplate.HasValue())
            {
                settings["fixedGroupTemplate"] = FixedGroupTemplate;
            }

            if (GroupTemplateId.HasValue())
            {
                settings["groupTemplate"] = new ClientHandlerDescriptor {
                    HandlerName = string.Format(
                        "jQuery('{0}{1}').html()", IdPrefix, GroupTemplateId
                    )
                };
            }
            else if (GroupTemplate.HasValue())
            {
                settings["groupTemplate"] = GroupTemplate;
            }

            if (Height.HasValue)
            {
                settings["height"] = Height;
            }

            if (HighlightFirst.HasValue)
            {
                settings["highlightFirst"] = HighlightFirst;
            }

            if (IgnoreCase.HasValue)
            {
                settings["ignoreCase"] = IgnoreCase;
            }

            if (MinLength.HasValue)
            {
                settings["minLength"] = MinLength;
            }

            if (Placeholder?.HasValue() == true)
            {
                settings["placeholder"] = Placeholder;
            }

            if (Separator?.HasValue() == true)
            {
                settings["separator"] = Separator;
            }

            if (Suggest.HasValue)
            {
                settings["suggest"] = Suggest;
            }

            if (HeaderTemplateId.HasValue())
            {
                settings["headerTemplate"] = new ClientHandlerDescriptor {
                    HandlerName = string.Format(
                        "jQuery('{0}{1}').html()", IdPrefix, HeaderTemplateId
                    )
                };
            }
            else if (HeaderTemplate.HasValue())
            {
                settings["headerTemplate"] = HeaderTemplate;
            }

            if (TemplateId.HasValue())
            {
                settings["template"] = new ClientHandlerDescriptor {
                    HandlerName = string.Format(
                        "jQuery('{0}{1}').html()", IdPrefix, TemplateId
                    )
                };
            }
            else if (Template.HasValue())
            {
                settings["template"] = Template;
            }

            if (ValuePrimitive.HasValue)
            {
                settings["valuePrimitive"] = ValuePrimitive;
            }

            var @virtual = Virtual.Serialize();
            if (@virtual.Any())
            {
                settings["virtual"] = @virtual;
            }
            else if (Virtual.Enabled.HasValue)
            {
                settings["virtual"] = Virtual.Enabled;
            }

            return settings;
        }
    }
}