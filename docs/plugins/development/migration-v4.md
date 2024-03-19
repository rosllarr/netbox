# Migrating Your Plugin to NetBox v4.0

This document serves as a handbook for maintainers of plugins that were written prior to the release of NetBox v4.0. It serves to capture all the changes recommended to ensure a plugin is compatible with NetBox v4.0 and later releases.

## General

### Python 3.10+ required

NetBox v4.0 drops support for Python 3.8 and 3.9. You may need to update your CI/CD processes to reflect this.

### Plugin resources relocated

All plugin Python resources were moved from `extras.plugins` to `netbox.plugins` in NetBox v3.7 (see [#14036](https://github.com/netbox-community/netbox/issues/14036)), and support for importing these resources from their old locations has been removed.

```python title="Old"
from extras.plugins import PluginConfig
```

```python title="New"
from netbox.plugins import PluginConfig
```

### ContentType renamed to ObjectType

NetBox's proxy model for Django's [ContentType model](https://docs.djangoproject.com/en/5.0/ref/contrib/contenttypes/#the-contenttype-model) has been renamed to ObjectType for clarity. In general, plugins should use the ObjectType proxy when referencing content types, as it includes several custom manager methods. The one exception to this is when defining [generic foreign keys](https://docs.djangoproject.com/en/5.0/ref/contrib/contenttypes/#generic-relations): The ForeignKey field used for a GFK should point to Django's native ContentType.

Additionally, plugin maintainers are strongly encouraged to adopt the "object type" terminology for field and filter names wherever feasible to be consistent with NetBox core (however this is not required for compatibility).

```python title="Old"
content_types = models.ManyToManyField(
    to='contenttypes.ContentType',
    related_name='event_rules'
)
```

```python title="New"
object_types = models.ManyToManyField(
    to='core.ObjectType',
    related_name='event_rules'
)
```

## Views

### View actions must be dictionaries

The format for declaring view actions & permissions was updated in NetBox v3.7 (see [#13550](https://github.com/netbox-community/netbox/issues/13550)), and NetBox v4.0 drops support for the old format. Views which inherit `ActionsMixin` must declare a single `actions` map.

```python title="Old"
actions = ('add', 'import', 'export', 'bulk_edit', 'bulk_delete')
action_perms = defaultdict(set, **{
    'add': {'add'},
    'import': {'add'},
    'bulk_edit': {'change'},
    'bulk_delete': {'delete'},
})
```

```python title="New"
actions = {
    'add': {'add'},
    'import': {'add'},
    'export': set(),
    'bulk_edit': {'change'},
    'bulk_delete': {'delete'},
}
```

## Forms

### Remove `BootstrapMixin`

The `BootstrapMixin` class is no longer available or needed and can be removed from all forms.

```python title="Old"
from django import forms
from utilities.forms import BootstrapMixin

class MyForm(BootstrapMixin, forms.Form):
```

```python title="New"
from django import forms

class MyForm(forms.Form):
```

## Navigation

### Remove button colors

NetBox no longer applies color to buttons within navigation menu items. Although this functionality is still supported, you might want to remove color from any buttons to ensure consistency with the updated design.

```python title="Old"
PluginMenuButton(
    link='myplugin:foo_add',
    title='Add a new Foo',
    icon_class='mdi mdi-plus-thick',
    color=ButtonColorChoices.GREEN
)
```

```python title="New"
PluginMenuButton(
    link='myplugin:foo_add',
    title='Add a new Foo',
    icon_class='mdi mdi-plus-thick'
)
```

## UI Layout

### Renamed template blocks

The following template blocks have been renamed or removed:

| Template            | Old name          | New name                  |
|---------------------|-------------------|---------------------------|
| generic/object.html | `header`          | `page-header`             |
| generic/object.html | `controls`        | `control-buttons`         |
| base/layout.html    | `content-wrapper` | _Removed_ (use `content`) |

### Utilize flex controls

Ditch any legacy "float" controls (e.g. `float-end`) in favor of Bootstrap's new [flex behaviors](https://getbootstrap.com/docs/5.3/utilities/flex/) for controlling the layout and sizing of elements horizontally. For example, the following will align two items against the left and right sides of the parent element:

```html
<div class="d-flex justify-content-between">
    <h3>Title text</h3>
    <i class="mdi mdi-close"></i>
</div>
```

### Check column offsets

When using [offset columns](https://getbootstrap.com/docs/5.3/layout/columns/#offsetting-columns) (e.g. `class="col-offset-3"`), be sure to also set the column width (e.g. `class="col-9 col-offset-3"`) to avoid horizontal scrolling.

### Tables inside cards

Tables inside cards should be embedded directly, not nested inside a `card-body` element.

```html title="Old"
<div class="card">
    <div class="card-body">
        <table class="table table-hover attr-table">
            ...
        </table>
    </div>
</div>
```

```html title="New"
<div class="card">
    <table class="table table-hover attr-table">
        ...
    </table>
</div>
```

### Remove `btn-sm` class from buttons

The `btn-sm` (small) class is no longer typically needed on general-purpose buttons.

```html title="Old"
<a href="#" class="btn btn-sm btn-primary">Text</a>
```

```html title="New"
<a href="#" class="btn btn-primary">Text</a>
```

### Update `bg-$color` classes

Foreground (text) color is no longer automatically adjusted by `bg-$color` classes. To ensure sufficient contrast with the background color, use the [`text-bg-$color`](https://getbootstrap.com/docs/5.3/helpers/color-background/) form of the class instead, or set the text color separately with `text-$color`.

```html title="Old"
<span class="badge bg-primary">Text</span>
```

```html title="New"
<span class="badge text-bg-primary">Text</span>
```

### Obsolete custom CSS classes

The following custom CSS classes have been removed:

* `object-subtitle` (use `text-secondary` instead)

## REST API

### Extend serializer for brief mode

NetBox now uses a single API serializer for both normal and "brief" modes (i.e. `GET /api/dcim/sites/?brief=true`); nested serializer classes are no longer required. Two changes to API serializers are necessary to support brief mode:

1. Define `brief_fields` under its `Meta` class. These are the fields which will be included when brief mode is used.
2. For any nested objects, switch to using the primary serializer and pass `nested=True`.

Any nested serializers which are no longer needed can be removed.

```python title="Old"
class SiteSerializer(NetBoxModelSerializer):
    region = NestedRegionSerializer(required=False, allow_null=True)

    class Meta:
        model = Site
        fields = ('id', 'url', 'display', 'name', 'slug', 'status', 'region', 'time_zone', ...)
```

```python title="New"
class SiteSerializer(NetBoxModelSerializer):
    region = RegionSerializer(nested=True, required=False, allow_null=True)

    class Meta:
        model = Site
        fields = ('id', 'url', 'display', 'name', 'slug', 'status', 'region', 'time_zone', ...)
        brief_fields = ('id', 'url', 'display', 'name', 'description', 'slug')
```

### Include description fields in brief mode

NetBox now includes the `description` the field in "brief" mode for all models which have one. This is not required for plugins, but you may opt to do the same for consistency.
