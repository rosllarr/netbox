__all__ = (
    'render_partial',
)

PAGE_CONTAINER_ID = 'page-content'


def render_partial(request):
    """
    Determines whether to render a partial response.
    """
    return request.htmx and request.htmx.target != PAGE_CONTAINER_ID
