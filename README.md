# Aorta3D setup

    cd frontend
    npm install

After installation, edit file `node_modules/material-table/types/index.d.ts` and remove line 235: `searchText?: string;` . Then continue:

    npm run build:dev

    cd ..

    cd server

    python3 server.py --port 5005 --host 0.0.0.0


In theory this should setup everything as we need it.
Remember to `npm install` each time you pull the repository!


Python packages that are required:

opencv-python
keras
scikit-image
pynrrd
tensorflow
numpy-stl
