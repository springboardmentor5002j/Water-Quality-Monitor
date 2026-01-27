from pydantic import BaseModel

class ReportCreate(BaseModel):
    photo_url: str
    location: str
    description: str
    water_source: str

class ReportOut(BaseModel):
    id: int
    photo_url: str
    location: str
    description: str
    water_source: str
    status: str
    created_at: str

    class Config:
        orm_mode = True



