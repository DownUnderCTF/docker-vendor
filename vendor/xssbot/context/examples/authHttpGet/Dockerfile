FROM python:3.9-slim
RUN pip install flask requests
COPY app.py /srv
CMD [ "python3", "/srv/app.py" ]