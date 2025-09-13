"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from drf_spectacular.utils import extend_schema

# Decorate built-in views to provide explicit OpenAPI tags
# Use Spanish tag names to match existing tags in the project
SpectacularSchemaView = extend_schema(tags=["OpenAPI"])(SpectacularAPIView)
# Token endpoints must be public (no security requirement in OpenAPI) so the UI
# does not show a lock icon next to them. We override the generated security with
# an empty list for these operations only.
TokenObtainPairViewTagged = extend_schema(tags=["Autenticación"], auth=[])(TokenObtainPairView)
TokenRefreshViewTagged = extend_schema(tags=["Autenticación"], auth=[])(TokenRefreshView)
from django.views.generic import RedirectView

urlpatterns = [
    path("accounts/", include("allauth.urls")),
    path("admin/", admin.site.urls),
    path("gestion/", include("gestion.urls")),
    # API endpoints (DRF + JWT)
    path("api/token/", TokenObtainPairViewTagged.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshViewTagged.as_view(), name="token_refresh"),
    path("api/", include("gestion.api.urls")),
    # Schema / docs (drf-spectacular)
    path("api/schema/", SpectacularSchemaView.as_view(), name="schema"),
    path("api/docs/swagger/", SpectacularSwaggerView.as_view(url_name='schema'), name="swagger-ui"),
    path("api/docs/redoc/", SpectacularRedocView.as_view(url_name='schema'), name="redoc"),
    # Redirect root to /gestion/
    path("", RedirectView.as_view(url="/gestion/", permanent=False)),
    # Keep website urls available under / (if you need them, move this to a different prefix)
    # path("", include("website.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
