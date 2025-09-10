from django.shortcuts import render

# Create your views here.

def web_index(request):
    return render(request, "web_index.html")